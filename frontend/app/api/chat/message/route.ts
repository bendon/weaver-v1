import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    console.log('Proxying chat message to backend:', {
      url: `${BACKEND_URL}/api/chat/message`,
      hasAuth: !!authHeader,
      bodyKeys: Object.keys(body)
    });
    
    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', backendResponse.status, backendResponse.statusText);

    // Get the response data
    const contentType = backendResponse.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await backendResponse.json();
    } else {
      const textData = await backendResponse.text();
      try {
        data = JSON.parse(textData);
      } catch {
        data = textData;
      }
    }
    
    // If backend returned an error, forward it
    if (!backendResponse.ok) {
      console.error('Backend returned error:', backendResponse.status, data);
      return NextResponse.json(
        typeof data === 'string' ? { detail: data } : data,
        { status: backendResponse.status }
      );
    }

    // Return the successful response
    console.log('Successfully proxied response:', {
      conversation_id: data?.conversation_id,
      message_id: data?.message_id,
      response_length: data?.response?.length
    });
    
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error proxying chat message:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

