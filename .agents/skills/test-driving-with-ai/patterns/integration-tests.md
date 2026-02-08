# Integration Test Patterns

## Overview

Integration tests verify that components work together correctly. They test the boundaries between modules, services, and systems.

## Contract Testing

Contract tests verify that two components agree on their interface:

### Provider Contract

```python
# Provider side: API must return expected schema
def test_user_api_returns_valid_schema():
    response = client.get("/api/users/1")

    assert response.status_code == 200
    data = response.json()

    # Contract: these fields must exist with these types
    assert isinstance(data["id"], int)
    assert isinstance(data["name"], str)
    assert isinstance(data["email"], str)
    assert "created_at" in data
```

### Consumer Contract

```python
# Consumer side: Service handles provider response
def test_user_service_parses_api_response():
    # Given: A response matching the contract
    api_response = {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2024-01-15T10:30:00Z"
    }

    # When: Parsing the response
    user = UserService.from_api_response(api_response)

    # Then: User object is correctly populated
    assert user.id == 1
    assert user.name == "John Doe"
```

### Contract Testing Tools

- **Pact**: Consumer-driven contract testing
- **Spring Cloud Contract**: JVM contract testing
- **OpenAPI validation**: Schema-based contract enforcement

## State Transition Testing

Test that state machines transition correctly:

```python
class TestOrderStateMachine:
    def test_order_transitions_from_pending_to_confirmed(self):
        order = Order(status="pending")
        order.confirm()
        assert order.status == "confirmed"

    def test_order_cannot_ship_before_confirmation(self):
        order = Order(status="pending")
        with pytest.raises(InvalidTransitionError):
            order.ship()

    def test_order_transitions_from_confirmed_to_shipped(self):
        order = Order(status="confirmed")
        order.ship()
        assert order.status == "shipped"
```

### State Transition Matrix

Document all valid transitions:

| From State | To State | Trigger | Valid |
|------------|----------|---------|-------|
| pending | confirmed | confirm() | Yes |
| pending | cancelled | cancel() | Yes |
| pending | shipped | ship() | No |
| confirmed | shipped | ship() | Yes |
| confirmed | cancelled | cancel() | Yes |
| shipped | delivered | deliver() | Yes |
| shipped | cancelled | cancel() | No |

## Error Propagation Testing

Verify errors flow correctly through the system:

```python
def test_database_error_propagates_to_api_response():
    # Given: Database will fail
    with patch('db.get_user') as mock_db:
        mock_db.side_effect = DatabaseConnectionError("Connection lost")

        # When: API endpoint is called
        response = client.get("/api/users/1")

        # Then: Appropriate error response
        assert response.status_code == 503
        assert "service unavailable" in response.json()["error"].lower()

def test_validation_error_includes_field_details():
    # When: Invalid data submitted
    response = client.post("/api/users", json={
        "email": "not-an-email",
        "age": -5
    })

    # Then: Error includes specific field failures
    assert response.status_code == 400
    errors = response.json()["errors"]
    assert "email" in errors
    assert "age" in errors
```

## Database Integration Testing

### Transaction Rollback Pattern

```python
@pytest.fixture
def db_session():
    """Each test gets a clean database state via transaction rollback."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

def test_user_creation_persists(db_session):
    user = User(name="Test User", email="test@example.com")
    db_session.add(user)
    db_session.commit()

    found = db_session.query(User).filter_by(email="test@example.com").first()
    assert found is not None
    assert found.name == "Test User"
```

### Testing Database Constraints

```python
def test_unique_email_constraint(db_session):
    user1 = User(email="same@example.com")
    db_session.add(user1)
    db_session.commit()

    user2 = User(email="same@example.com")
    db_session.add(user2)

    with pytest.raises(IntegrityError):
        db_session.commit()
```

## Service Communication Testing

### HTTP Client Testing

```python
@responses.activate
def test_external_api_timeout_handling():
    # Given: External API times out
    responses.add(
        responses.GET,
        "https://external-api.com/data",
        body=requests.exceptions.Timeout()
    )

    # When: Our service calls it
    result = our_service.fetch_external_data()

    # Then: Graceful degradation
    assert result.status == "unavailable"
    assert result.cached_at is not None  # Falls back to cache

@responses.activate
def test_retries_on_transient_failure():
    # First two calls fail, third succeeds
    responses.add(responses.GET, "https://api.com/data", status=503)
    responses.add(responses.GET, "https://api.com/data", status=503)
    responses.add(responses.GET, "https://api.com/data", json={"data": "success"})

    result = resilient_client.fetch()

    assert result["data"] == "success"
    assert len(responses.calls) == 3
```

### Message Queue Testing

```python
def test_message_published_on_order_creation(mock_queue):
    # When: Order is created
    order = OrderService.create(user_id=1, items=[...])

    # Then: Event published to queue
    assert mock_queue.published_messages == [
        {
            "event": "order.created",
            "order_id": order.id,
            "user_id": 1
        }
    ]

def test_message_consumer_processes_event(db_session):
    # Given: An order creation event
    event = {"event": "order.created", "order_id": 123}

    # When: Consumer processes it
    OrderEventConsumer.handle(event)

    # Then: Side effects occur
    notification = db_session.query(Notification).filter_by(order_id=123).first()
    assert notification is not None
```

## Integration Test Anti-Patterns

### Avoid: Testing Through Too Many Layers

```python
# Bad: Testing everything at once
def test_user_registration_end_to_end():
    response = client.post("/api/register", json={...})
    # Tests: HTTP handling, validation, service logic,
    # database writes, email sending, event publishing...
    # Too much - failures are hard to diagnose

# Good: Test integration point specifically
def test_user_service_publishes_registration_event(mock_event_bus):
    user_service.register(email="test@example.com")
    assert mock_event_bus.published("user.registered")
```

### Avoid: Flaky External Dependencies

```python
# Bad: Tests depend on real external service
def test_weather_integration():
    result = weather_service.get_forecast("NYC")
    assert "temperature" in result  # Fails when API is down

# Good: Use contract tests or record/replay
@vcr.use_cassette('weather_forecast.yaml')
def test_weather_integration():
    result = weather_service.get_forecast("NYC")
    assert "temperature" in result
```

## Prompt Template for Integration Tests

```
Write integration tests for the interaction between [Component A] and [Component B].

INTEGRATION POINTS:
1. [How A calls B]
2. [Data that flows between them]
3. [How errors should propagate]

SCENARIOS TO TEST:

Happy Path:
- [Successful interaction scenario]

Failure Scenarios:
- [Component B] returns error
- [Component B] times out
- [Component B] returns malformed data

Edge Cases:
- Concurrent calls
- Large payloads
- Empty responses

Use [framework]. Mock external dependencies but test real integration between A and B.
```
