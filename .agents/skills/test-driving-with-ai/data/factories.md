# Test Data Factories

## Python: Faker

```bash
pip install faker
```

```python
from faker import Faker

fake = Faker()

# Basic usage
fake.name()           # 'Lucy Cechtelar'
fake.email()          # 'lucy@example.org'
fake.address()        # '426 Jordy Lodge\nCartwrightshire, SC 88120'

# Localization
fake = Faker('de_DE')
fake.name()           # 'Sabrina Fischer'

# Seed for reproducibility
Faker.seed(4321)
fake.name()           # Always 'Margaret Boehm'

# Unique values (no duplicates)
names = [fake.unique.first_name() for _ in range(100)]
```

### Common Methods

```python
fake.first_name()
fake.last_name()
fake.email()
fake.phone_number()
fake.date_of_birth()
fake.address()
fake.city()
fake.country()
fake.company()
fake.job()
fake.text()
fake.uuid4()
fake.url()
fake.ipv4()
fake.credit_card_number()
fake.iban()
```

### Simple Factory Function

```python
def make_user(**overrides):
    defaults = {
        "name": fake.name(),
        "email": fake.email(),
        "active": True,
    }
    return {**defaults, **overrides}

# Usage
user = make_user(role="admin")
```

---

## TypeScript: @faker-js/faker

```bash
npm install @faker-js/faker
```

```typescript
import { faker } from '@faker-js/faker';

// Basic usage
faker.person.fullName();        // 'John Doe'
faker.internet.email();         // 'john.doe@example.com'
faker.location.streetAddress(); // '426 Jordy Lodge'

// Localization
import { fakerDE } from '@faker-js/faker';
fakerDE.person.fullName();      // 'Sabrina Fischer'

// Seed for reproducibility
faker.seed(4321);
faker.person.fullName();        // Always same value

// Unique values
const names = faker.helpers.uniqueArray(faker.person.firstName, 100);
```

### Common Methods

```typescript
faker.person.firstName()
faker.person.lastName()
faker.internet.email()
faker.phone.number()
faker.date.birthdate()
faker.location.streetAddress()
faker.location.city()
faker.location.country()
faker.company.name()
faker.person.jobTitle()
faker.lorem.paragraph()
faker.string.uuid()
faker.internet.url()
faker.internet.ip()
faker.finance.creditCardNumber()
faker.finance.iban()
```

### Simple Factory Function

```typescript
function makeUser(overrides: Partial<User> = {}): User {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    active: true,
    ...overrides,
  };
}

// Usage
const user = makeUser({ role: 'admin' });
```

---

## Edge Cases

Faker generates realistic data but won't find edge cases. Define those explicitly:

```python
edge_cases = [0, 1, -1, None, "", "   ", [], {}]
```

```typescript
const edgeCases = [0, 1, -1, null, undefined, "", "   ", [], {}];
```
