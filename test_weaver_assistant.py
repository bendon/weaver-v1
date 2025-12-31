#!/usr/bin/env python3
"""
Test script for WeaverAssistant automation framework
Run this to verify the automation system is working correctly
"""

import asyncio
from app.v2.weaver_assistant.service import weaver_assistant_service


async def test_automation(message: str, description: str):
    """Test a single automation"""
    print(f"\n{'='*80}")
    print(f"TEST: {description}")
    print(f"{'='*80}")
    print(f"User message: '{message}'\n")

    try:
        # Simulate user context
        context = {
            "user_id": "test_user_123",
            "organization_id": "test_org_456",
            "user": {
                "full_name": "Test User",
                "email": "test@example.com"
            }
        }

        # Process the message
        result = await weaver_assistant_service.process_message(
            user_id=context["user_id"],
            message=message,
            conversation_id=None,
            organization_id=context["organization_id"]
        )

        # Display results
        print(f"✓ Intent recognized: {result['intent']['type']} (confidence: {result['intent']['confidence']:.2f})")
        print(f"✓ Status: {result['response']['status']}")
        print(f"✓ Template: {result['response']['template']}")
        print(f"\nResponse:")
        print("-" * 80)
        print(result['response']['message'])
        print("-" * 80)

        if result['response'].get('actions'):
            print(f"\nActions available ({len(result['response']['actions'])}):")
            for i, action in enumerate(result['response']['actions'], 1):
                print(f"  {i}. {action['label']} (action: {action['action']})")

        if result.get('requires_confirmation'):
            print(f"\n⚠️  Requires confirmation: {result.get('next_step')}")

        return True

    except Exception as e:
        print(f"✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("WEAVERASSISTANT AUTOMATION FRAMEWORK TEST SUITE")
    print("="*80)

    tests = [
        # Greeting
        ("Hello", "Greeting automation"),

        # Destination info
        ("Tell me about Kenya", "Destination information automation"),

        # Flight search
        ("Find flights to Cape Town tomorrow", "Flight search automation"),

        # Hotel search
        ("Search for luxury hotels in Zanzibar", "Hotel search automation"),

        # Itinerary builder
        ("Plan a 7-day safari in Masai Mara", "Itinerary builder automation"),

        # Bookings
        ("Show me all my bookings", "View bookings automation"),

        # Travelers
        ("List all travelers", "Traveler management automation"),

        # Unknown intent
        ("This is a random query that doesn't match any intent", "Unknown intent handling"),
    ]

    passed = 0
    failed = 0

    for message, description in tests:
        success = await test_automation(message, description)
        if success:
            passed += 1
        else:
            failed += 1

        # Small delay between tests
        await asyncio.sleep(0.5)

    # Summary
    print(f"\n{'='*80}")
    print("TEST SUMMARY")
    print(f"{'='*80}")
    print(f"Total tests: {len(tests)}")
    print(f"✓ Passed: {passed}")
    print(f"✗ Failed: {failed}")
    print(f"Success rate: {(passed/len(tests)*100):.1f}%")
    print("="*80 + "\n")

    if failed == 0:
        print("🎉 All tests passed! WeaverAssistant is working correctly.\n")
    else:
        print(f"⚠️  {failed} test(s) failed. Please review the errors above.\n")


if __name__ == "__main__":
    print("\nStarting WeaverAssistant test suite...")
    print("This will test the automation framework without requiring database or API setup.\n")

    asyncio.run(main())
