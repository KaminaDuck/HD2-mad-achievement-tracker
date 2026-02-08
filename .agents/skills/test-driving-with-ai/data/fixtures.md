# Test Fixture Management

## Overview

Fixtures are data sets loaded before tests run. This guide covers fixture patterns, database seeding, isolation strategies, and common pitfalls.

## Framework Fixture Patterns

### pytest Fixtures (Python)

```python
import pytest

@pytest.fixture
def db_session():
    """Create a database session for the test."""
    session = create_session()
    yield session
    session.rollback()

@pytest.fixture
def sample_user(db_session):
    """Create a test user in the database."""
    user = User(name="Test User", email="test@example.com")
    db_session.add(user)
    db_session.commit()
    return user

def test_user_can_place_order(sample_user):
    order = Order(user_id=sample_user.id, total=100)
    assert order.user_id == sample_user.id
```

### Fixture Scopes

```python
@pytest.fixture(scope="function")  # Default: new for each test
def per_test_fixture():
    return create_resource()

@pytest.fixture(scope="class")  # Shared within test class
def per_class_fixture():
    return create_expensive_resource()

@pytest.fixture(scope="module")  # Shared within module
def per_module_fixture():
    return create_very_expensive_resource()

@pytest.fixture(scope="session")  # Shared across all tests
def per_session_fixture():
    return create_extremely_expensive_resource()
```

### Jest beforeEach (JavaScript)

```javascript
let testUser;

beforeEach(async () => {
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com'
  });
});

afterEach(async () => {
  await User.destroy({ where: { id: testUser.id } });
});

test('user can place order', () => {
  const order = new Order({ userId: testUser.id });
  expect(order.userId).toBe(testUser.id);
});
```

## Database Seeding Patterns

### SQL Scripts

```sql
-- seed_users.sql
INSERT INTO users (id, name, email, tier)
VALUES
  (1, 'Admin User', 'admin@test.com', 'admin'),
  (2, 'Test User', 'user@test.com', 'basic');
```

**Pros**: Simple, fast
**Cons**: Brittle when schema changes, hard to maintain relationships

### Programmatic Seeding

```python
def seed_database(session):
    admin = User(name='Admin', email='admin@test.com', tier='admin')
    session.add(admin)

    for i in range(10):
        user = UserFactory(tier='basic')
        session.add(user)

    session.commit()
```

**Pros**: Type-safe, handles relationships
**Cons**: Slower, requires ORM setup

### Idempotent Seeding

```python
def seed_or_update(session):
    """Safe to run multiple times."""
    admin = session.query(User).filter_by(email='admin@test.com').first()
    if not admin:
        admin = User(name='Admin', email='admin@test.com')
        session.add(admin)
    admin.tier = 'admin'  # Always update tier
    session.commit()
```

## Test Isolation Strategies

### Transaction Rollback

Each test runs in a transaction that rolls back after the test completes.

```python
@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
```

**Pros**: Fast, clean isolation
**Cons**: Cannot test transaction behavior, some ORMs struggle

### Truncation

Delete all data between tests.

```python
@pytest.fixture(autouse=True)
def clean_database(db_session):
    yield
    # Clean up after test
    for table in reversed(Base.metadata.sorted_tables):
        db_session.execute(table.delete())
    db_session.commit()
```

**Pros**: Tests actual commits
**Cons**: Slower than rollback

### Database Per Worker

For parallel tests, each worker gets its own database.

```python
@pytest.fixture(scope="session")
def db_url(worker_id):
    return f"postgresql://localhost/test_db_{worker_id}"
```

## Fixture Organization

### Directory Structure

```
tests/
  fixtures/
    users/
      admin.json
      regular_user.json
      premium_user.json
    orders/
      pending_order.json
      completed_order.json
  factories/
    user_factory.py
    order_factory.py
  data/
    boundary_values.csv
    unicode_test_strings.txt
```

### Naming Conventions

- Descriptive names reflecting the scenario: `user_with_expired_subscription.json`
- Version suffixes if data evolves: `legacy_order_v1.json`
- Environment prefixes if needed: `dev_seed_data.sql`

### Loading JSON Fixtures

```python
import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / "fixtures"

def load_fixture(name: str) -> dict:
    """Load a JSON fixture by name."""
    path = FIXTURES_DIR / f"{name}.json"
    with open(path) as f:
        return json.load(f)

@pytest.fixture
def premium_user_data():
    return load_fixture("users/premium_user")
```

## Shared vs Isolated Fixtures

| Approach | Speed | Isolation | Use When |
|----------|-------|-----------|----------|
| Shared (session scope) | Fast | Low | Read-only data, expensive setup |
| Per-test (function scope) | Slow | High | Tests modify data |
| Transaction rollback | Medium | High | Most database tests |

### Making Shared Fixtures Safe

```python
@pytest.fixture(scope="module")
def shared_config():
    """Shared, immutable configuration."""
    return frozendict({
        "api_url": "https://api.test.com",
        "timeout": 30
    })

# Bad: Mutable shared fixture
@pytest.fixture(scope="module")
def shared_list():
    return []  # Tests can modify this!
```

## Data-Driven Testing

### Parameterized Tests

```python
@pytest.mark.parametrize("input,expected", [
    ("", False),
    ("a@b.com", True),
    ("invalid", False),
    ("user@domain.co.uk", True),
    ("a@b", False),
])
def test_email_validation(input, expected):
    assert is_valid_email(input) == expected
```

### External Data Sources

```python
import csv

def load_test_cases():
    with open("test_cases.csv") as f:
        reader = csv.DictReader(f)
        return [(row["input"], row["expected"]) for row in reader]

@pytest.mark.parametrize("input,expected", load_test_cases())
def test_from_csv(input, expected):
    assert process(input) == expected
```

## Common Pitfalls

### Hardcoded Test Users

```python
# BAD: Breaks on fresh database
def test_checkout():
    user = User.query.filter_by(email='viktor@test.com').first()
    # Fails if viktor doesn't exist
```

### Fix: Create Data in Test

```python
# GOOD: Self-contained
def test_checkout(db_session):
    user = UserFactory()
    order = checkout(user)
    assert order is not None
```

### Test Interdependence

```python
# BAD: Tests depend on execution order
def test_create_user():
    create_user("john@example.com")

def test_find_user():
    # Fails if test_create_user didn't run first
    user = find_user("john@example.com")
    assert user is not None
```

### Fix: Independent Tests

```python
# GOOD: Each test creates its own data
def test_find_created_user(db_session):
    user = UserFactory(email="john@example.com")
    found = find_user("john@example.com")
    assert found.id == user.id
```

### Flaky Randomization

```python
# BAD: Random dates sometimes fail validation
created_at = fake.date_time()  # Might be in future!
```

### Fix: Constrained Generation

```python
# GOOD: Constrain to valid range
created_at = fake.date_time_between(start_date='-1y', end_date='now')
```

## Cleanup Strategies

### Explicit Cleanup

```python
@pytest.fixture
def temp_file():
    path = create_temp_file()
    yield path
    os.unlink(path)  # Always runs, even if test fails
```

### Using Context Managers

```python
@pytest.fixture
def temp_directory():
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir
    # Directory automatically cleaned up
```

### Cleanup Order

When tests have dependencies, cleanup order matters:

```python
@pytest.fixture
def db_user(db_session):
    user = UserFactory()
    yield user
    # db_session cleanup runs after this

@pytest.fixture
def db_session():
    session = create_session()
    yield session
    session.rollback()  # Runs last, cleans up user
```
