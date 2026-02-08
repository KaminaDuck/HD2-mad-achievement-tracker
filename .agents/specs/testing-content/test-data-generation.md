# Test Data Generation

## Overview

Test data generation is the process of creating datasets used to validate application behavior. Unlike property-based testing which generates random inputs to find edge cases, test data generation focuses on creating *intentional*, *realistic* data for specific test scenarios.

The two approaches are complementary:
- **Property-based testing**: Automatic random generation to discover bugs through invariant violations
- **Test data generation**: Deliberate construction of realistic data representing known scenarios

This document covers traditional patterns (factories, builders, fixtures), realistic data generation tools, AI-assisted approaches, and test data management strategies.

### When to Use Each Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| Finding unexpected edge cases | Property-based testing |
| Testing specific business scenarios | Test data factories |
| E2E tests needing realistic user data | Faker/synthetic generation |
| Database-dependent integration tests | Fixtures + seeding |
| Training ML models | Synthetic data generation |
| Testing with production-like complexity | Masked production copies |

---

## Test Data Patterns

### Object Mother Pattern

The Object Mother pattern, defined by Martin Fowler, provides factory methods that create pre-configured test objects. Each "mother" class creates objects in specific, meaningful states.

```python
class CustomerMother:
    @staticmethod
    def premium_customer():
        return Customer(
            id=1,
            name="Premium Corp",
            tier="premium",
            credit_limit=100000,
            since=date(2020, 1, 1)
        )

    @staticmethod
    def new_customer():
        return Customer(
            id=2,
            name="Startup Inc",
            tier="basic",
            credit_limit=5000,
            since=date.today()
        )
```

**Advantages:**
- Named methods communicate intent (`premium_customer` vs anonymous data)
- Reusable across test files
- Team develops familiarity with "personas" (John, Heather, etc.)

**Disadvantages:**
- Heavy coupling: many tests depend on exact data in mothers
- Tends to grow into a "termite queen" with methods for every scenario
- Changes to class structure require updating all mothers

### Test Data Builder Pattern

The Builder pattern addresses Object Mother's inflexibility by returning configurable builders instead of fixed objects:

```java
public class OrderBuilder {
    private Long orderId = 1L;
    private Customer customer = new CustomerBuilder().build();
    private List<OrderItem> items = new ArrayList<>();
    private Double discountRate = 0.0;

    public OrderBuilder withCustomer(CustomerBuilder customer) {
        this.customer = customer.build();
        return this;
    }

    public OrderBuilder withDiscount(Double rate) {
        this.discountRate = rate;
        return this;
    }

    public Order build() {
        Order order = new Order(orderId, customer, discountRate);
        items.forEach(order::addOrderItem);
        return order;
    }
}

// Usage
Order order = anOrder()
    .withCustomer(aCustomer().withAddress(anAddress().withCountry("Germany")))
    .withDiscount(0.15)
    .build();
```

**Key principles:**
- Safe defaults hide irrelevant details
- Accept builders as arguments (reduces `.build()` calls)
- Factory methods like `anOrder()` and `aCustomer()` make tests read like domain language
- The `but()` method prevents shared state from leaking between variations

### Combining Object Mother and Builder

The most flexible approach combines both patterns: Object Mother returns pre-configured Builders:

```java
class InvoiceMother {
    static Invoice.InvoiceBuilder complete() {
        return Invoice.builder()
            .id(42L)
            .address(AddressMother.complete().build())
            .items(List.of(InvoiceItemMother.complete().build()));
    }

    static Invoice.InvoiceBuilder refund() {
        return complete().totalPrice(-100.00);
    }
}

// Test gets a complete invoice with one modification
Invoice invoice = InvoiceMother.complete()
    .address(AddressMother.abroad().build())
    .build();
```

This reduces Object Mother bloat while maintaining the convenience of pre-defined scenarios.

### Fixture Management

Fixtures are data sets loaded before tests run. Framework-specific patterns:

**pytest fixtures (Python):**
```python
@pytest.fixture
def db_session():
    session = create_session()
    yield session
    session.rollback()

@pytest.fixture
def sample_user(db_session):
    user = User(name="Test User", email="test@example.com")
    db_session.add(user)
    db_session.commit()
    return user

def test_user_can_place_order(sample_user):
    order = Order(user_id=sample_user.id, total=100)
    assert order.user_id == sample_user.id
```

**Jest beforeEach (JavaScript):**
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
```

**Shared vs isolated fixtures:**
- Shared fixtures (module/session scope): Fast, though tests become interdependent
- Isolated fixtures (function scope): Slower; each test starts fresh
- Transaction rollback: Isolation without deletion overhead

### Data-Driven Testing

Parameterized tests run the same logic against multiple data sets:

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

**External data sources:**
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

---

## Realistic Data Generation

### Production-Like Data

Testing against production-like data catches issues that synthetic data misses. Approaches:

**Data masking/anonymization:**
Production data is copied and sensitive fields are replaced with synthetic alternatives while preserving structure and relationships. Tools like Tonic.ai, Delphix, and Broadcom Test Data Manager specialize in this.

**Statistical matching:**
Generate data that matches production distributions. If 40% of production users are premium tier, test data should reflect this ratio.

**Edge case injection:**
Augment realistic data with known edge cases: maximum-length strings, unicode characters, boundary values.

### Domain-Specific Data with Faker

Faker libraries generate realistic data for common domains:

**Python Faker:**
```python
from faker import Faker

fake = Faker()

# Basic usage
fake.name()       # 'Lucy Cechtelar'
fake.email()      # 'lucy@example.org'
fake.address()    # '426 Jordy Lodge\nCartwrightshire, SC 88120'

# Localization
fake = Faker('de_DE')
fake.name()       # 'Sabrina Fischer'
fake.address()    # 'Samira-Niemeier-Allee 56\n94812 Biedenkopf'

# Seeding for reproducibility
Faker.seed(4321)
fake.name()       # Always 'Margaret Boehm' with this seed

# Unique values
names = [fake.unique.first_name() for _ in range(500)]
```

**JavaScript Faker:**
```javascript
import { faker } from '@faker-js/faker';

faker.person.fullName();       // 'John Doe'
faker.internet.email();        // 'john.doe@example.com'
faker.finance.creditCardNumber();  // '4532-1234-5678-9012'
faker.date.future();           // Date object for a future date
```

**Faker providers by domain:**
- `faker.providers.person` - Names, titles, suffixes
- `faker.providers.address` - Streets, cities, countries, postal codes
- `faker.providers.bank` - IBANs, BICs, account numbers
- `faker.providers.credit_card` - Card numbers, expiry dates
- `faker.providers.date_time` - Dates, times, timezones
- `faker.providers.internet` - Emails, URLs, IP addresses

### Factory Libraries

**factory_boy (Python):**
```python
import factory
from myapp.models import User, Order

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Faker('user_name')
    email = factory.Faker('email')
    is_active = True

class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    user = factory.SubFactory(UserFactory)
    total = factory.Faker('pydecimal', left_digits=4, right_digits=2)
    status = 'pending'

# Usage
order = OrderFactory(user__username='specific_user')
```

**pytest-factoryboy integration:**
```python
from pytest_factoryboy import register

register(UserFactory)
register(OrderFactory)

# Fixtures auto-generated: user, order
def test_order_belongs_to_user(user, order):
    assert order.user == user
```

### factory_boy Antipatterns

Common mistakes with factory_boy (from [Sebastian Buczynski's analysis](https://pythoneer.substack.com/p/on-factory_boy-antipatterns-and-patterns)):

**Antipattern: Excessive randomization**
```python
class UserFactory(factory.Factory):
    # Random datetime that gets validated later
    created_at = factory.Faker('date_time')
    # Random decimal that sometimes goes negative
    balance = factory.Faker('pydecimal')
```

Random values in fields affecting business logic cause flaky tests. A random datetime might be in the future when validation expects past dates. A random decimal might be negative when the field should be positive.

**Pattern: Stereotype objects**
```python
class UserFactory(factory.Factory):
    first_name = "Joe"      # Fixed, known values
    last_name = "Petain"
    balance = Decimal("100.00")

class PremiumUserFactory(UserFactory):
    tier = "premium"
    credit_limit = Decimal("50000.00")
```

Use explicit defaults and specialized subclasses for specific states.

**Antipattern: Overusing relations**
Adding forced relations between unrelated models to create everything at once leads to monolithic test data that's hard to understand and maintain.

---

## AI-Assisted Data Generation

### LLM Prompts for Test Data

LLMs generate realistic fixture sets that would take hours to create manually:

**Generating domain-specific records:**
```
Generate 20 realistic customer records for a B2B SaaS company.
Include: company name, industry, employee count, annual revenue,
subscription tier (free/pro/enterprise), and signup date.

Vary the data realistically:
- 60% should be small businesses (<50 employees)
- 30% medium (50-500)
- 10% enterprise (>500)
- Signup dates should span the last 3 years
```

**Generating edge case variations:**
```
Given this valid user profile:
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1-555-123-4567"
}

Generate 15 edge case variations testing input validation:
- Unicode characters in names
- International phone formats
- Email edge cases (long local parts, subdomains)
- Boundary lengths
- Special characters
```

**Few-shot pattern for consistent data:**
```
Generate user records in this exact format:

Example 1:
{"id": "usr_001", "name": "Alice Chen", "role": "admin", "department": "Engineering"}

Example 2:
{"id": "usr_002", "name": "Bob Wilson", "role": "user", "department": "Sales"}

Generate 10 more records following this pattern, ensuring unique IDs
and realistic name/department combinations.
```

### AI for Data Gap Analysis

LLMs identify missing test scenarios:

```
Here are the test cases for our email validation function:
1. Valid standard email
2. Email without @ symbol
3. Email without domain

What scenarios are missing? Consider:
- International domains
- Special characters
- Length limits
- Subdomain handling
```

### Synthetic Data for LLM Testing

When testing LLM-based applications, synthetic datasets help evaluate quality:

**Generating test inputs:**
```python
# Using OpenAI to generate airline chatbot questions
def generate_airline_questions(num_questions=20):
    questions = []
    for i in range(num_questions):
        completion = client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "Generate a realistic customer question for an airline chatbot."
            }],
            temperature=1
        )
        questions.append(completion.choices[0].message.content)
    return questions
```

**Test case categories for LLM applications:**
- Happy path queries (common, expected)
- Edge cases like ambiguous or multi-part inputs
- Adversarial inputs: jailbreaks, policy violations

**RAG dataset generation:**
For Retrieval-Augmented Generation systems, generate question-answer pairs directly from the knowledge base:
1. Extract key facts from documents
2. Generate questions that would be answered by those facts
3. Store context, question, and answer as ground truth

---

## Edge Cases and Boundary Data

### Boundary Value Analysis

Test at the edges of valid ranges:

```python
# For a function accepting 1-100
test_cases = [
    (0, "below_min"),      # Just outside lower bound
    (1, "at_min"),         # At lower bound
    (2, "just_above_min"), # Just inside lower bound
    (99, "just_below_max"),
    (100, "at_max"),
    (101, "above_max"),
]
```

### Special Characters and Encoding

**Unicode edge cases:**
```python
unicode_test_cases = [
    "",                           # Zero-width joiner
    "Test\u200BString",           # Zero-width space
    "RTL text",                   # Right-to-left
    "Emoji test",                 # Emoji
    "CJK test",                   # CJK characters
    "A" * 10000,                  # Very long string
]
```

**Security test strings:**
```python
injection_tests = [
    "'; DROP TABLE users; --",              # SQL injection
    "<script>alert('xss')</script>",        # XSS
    "{{7*7}}",                              # Template injection
    "../../../etc/passwd",                  # Path traversal
]
```

### Null and Empty Variations

```python
null_test_cases = [
    None,           # Explicit null
    "",             # Empty string
    "   ",          # Whitespace only
    [],             # Empty list
    {},             # Empty dict
    0,              # Zero (often confused with null)
    False,          # Boolean false (often confused with null)
]
```

---

## Test Data Management

### Data Organization

**Directory structure:**
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

**Naming conventions:**
- Descriptive names reflecting the scenario: `user_with_expired_subscription.json`
- Version suffixes if data evolves: `legacy_order_v1.json`
- Environment prefixes if needed: `dev_seed_data.sql`

### Database Seeding

**Seeding patterns:**

*SQL scripts:*
```sql
-- seed_users.sql
INSERT INTO users (id, name, email, tier)
VALUES
  (1, 'Admin User', 'admin@test.com', 'admin'),
  (2, 'Test User', 'user@test.com', 'basic');
```

Pros: Simple, fast
Cons: Brittle when schema changes, hard to maintain relationships

*Programmatic seeding:*
```python
def seed_database(session):
    admin = User(name='Admin', email='admin@test.com', tier='admin')
    session.add(admin)

    for i in range(10):
        user = UserFactory(tier='basic')
        session.add(user)

    session.commit()
```

Pros: Type-safe, handles relationships
Cons: Slower, requires ORM setup

*Idempotent seeding:*
```python
def seed_or_update(session):
    admin = session.query(User).filter_by(email='admin@test.com').first()
    if not admin:
        admin = User(name='Admin', email='admin@test.com')
        session.add(admin)
    admin.tier = 'admin'  # Always update tier
    session.commit()
```

### Test Isolation

**Transaction rollback:**
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

Each test sees a clean database state without deletion overhead.

**Parallel test considerations:**
- Use unique identifiers per test run to avoid collisions
- Scope fixtures appropriately (session vs function)
- Consider database-per-worker for true isolation

---

## Limitations and Pitfalls

### Data Drift

Test data becomes stale as production evolves:
- Schema changes break fixtures
- Business rules change but test data doesn't reflect new constraints
- Production data distributions shift

**Mitigation:**
- Regularly refresh masked production copies
- Automated validation that test data matches current schema
- Monitor production data patterns and update test distributions

### Privacy and Compliance

Using production data for testing risks privacy violations:
- PII in test environments violates GDPR/HIPAA
- Synthetic data must be truly non-identifiable
- Models can memorize and reproduce patterns from source data

**GDPR considerations:**
- Synthetic data is not automatically anonymous under GDPR
- Pseudonymization still counts as personal data processing
- Combine synthetic data with privacy-enhancing technologies for compliance

**Approaches:**
- Data masking: Replace PII with fake but structurally similar data
- Differential privacy: Add noise to prevent individual identification
- Confidential computing: Process sensitive data in secure enclaves

### Performance Overhead

**Generation costs:**
- Creating complex object graphs is slow
- Database round-trips for each fixture add up
- AI-generated data has API latency

**Mitigation strategies:**
- Lazy generation: Create data only when accessed
- Caching: Reuse generated data across tests where safe
- Batch creation: Generate multiple records in single operations
- Minimal data: Generate only fields needed for specific tests

### Common Anti-Patterns

**Hardcoded test users:**
```python
# Bad: breaks on fresh database
def test_checkout():
    user = User.query.filter_by(email='viktor@test.com').first()
    # Fails if viktor doesn't exist
```

**Flaky randomization:**
```python
# Bad: random dates sometimes fail validation
created_at = fake.date_time()  # Might be in future
```

**Test interdependence:**
```python
# Bad: test_B depends on test_A's side effects
def test_A():
    create_order()

def test_B():
    # Assumes test_A ran first
    order = Order.query.first()
```

---

## Sources

### Primary Sources

1. **Martin Fowler** - "Object Mother"
   https://martinfowler.com/bliki/ObjectMother.html
   *Original definition of the Object Mother pattern for test fixtures*

2. **Reflectoring.io** - "Combining Object Mother and Fluent Builder for the Ultimate Test Data Factory"
   https://reflectoring.io/objectmother-fluent-builder/
   *Tom Hombergs - Practical guide to combining patterns with Java examples*

3. **Code With Arho** - "How to Create a Test Data Builder"
   https://www.arhohuttunen.com/test-data-builders/
   *Arho Huttunen - Builder pattern guide with Lombok integration*

### Tool Documentation

4. **Faker.js Documentation**
   https://fakerjs.dev/guide/
   *Official JavaScript Faker library documentation*

5. **Python Faker Documentation**
   https://faker.readthedocs.io/
   *Official Python Faker library with provider reference*

6. **pytest-factoryboy Documentation**
   https://pytest-factoryboy.readthedocs.io/
   *Integration of factory_boy with pytest fixtures*

### AI and Synthetic Data

7. **Evidently AI** - "How to create LLM test datasets with synthetic data"
   https://www.evidentlyai.com/llm-guide/llm-test-dataset-synthetic-data
   *Guide to synthetic data for LLM evaluation with practical examples*

8. **Langfuse** - "Synthetic Dataset Generation for LLM Evaluation"
   https://langfuse.com/guides/cookbook/example_synthetic_datasets
   *Practical cookbook with code examples for multiple approaches*

### Enterprise and Management

9. **Tonic.ai** - "Guide to Synthetic Test Data Generation"
   https://www.tonic.ai/guides/guide-to-synthetic-test-data-generation
   *Johnny Goodnow - Enterprise perspective with case studies (Flywire, Flexport, Paytient)*

10. **Enov8** - "The Definitive Guide to Test Data Generation"
    https://www.enov8.com/blog/test-data-generation/
    *Overview of techniques and tools for enterprise testing*

### Practitioner Experience

11. **pythoneer.guru** - "On factory_boy - antipatterns & patterns you won't find in the manual"
    https://pythoneer.substack.com/p/on-factory_boy-antipatterns-and-patterns
    *Sebastian Buczynski - Practical antipatterns from real projects*

12. **Mr.Slavchev** - "Hindsight lessons about automation: The mastery of data seeding"
    https://mrslavchev.com/2020/04/01/hindsight-lessons-about-automation-the-mastery-of-data-seeding/
    *Viktor Slavchev - Deep dive into data seeding approaches with pros/cons*

### Privacy and Compliance

13. **Decentriq** - "Is synthetic data truly GDPR compliant? What you need to know"
    https://www.decentriq.com/article/synthetic-data-privacy
    *Analysis of synthetic data privacy limitations and GDPR compliance*

14. **Atomic Spin** - "DIY Factory Fixtures in Pytest"
    https://spin.atomicobject.com/pytest-diy-factory-fixture/
    *Aaron King - Simple factory pattern without external dependencies*

---

## Internal References

- [property-based-testing-ai.md](property-based-testing-ai.md) - Complementary approach using random generation for edge case discovery
- [prompt-engineering-tests.md](prompt-engineering-tests.md) - Prompt templates for boundary value analysis and edge case expansion
- [ai-slop-tests.md](ai-slop-tests.md) - Copy-paste test variations as an antipattern
- [test-maintenance-ai.md](test-maintenance-ai.md) - Brittle tests from hardcoded data
