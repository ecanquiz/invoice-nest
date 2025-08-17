# Testing Approaches for NestJS with Vitest

## 📝 Overview
This document outlines practical strategies for testing NestJS applications using Vitest, especially when facing Dependency Injection (DI) challenges.

## 🔧 1. Direct Manual Injection Approach

**Context**: When NestJS's DI system doesn't cooperate with Vitest.

### Implementation
```typescript
// Servicios
const appService = new AppService(/* dependencies */);
// Or
const appService = module.get<AppService>(AppService);

// For controllers
const appController = new AppController(appService);
// Or
const appController = module.get<AppController>(AppService); // Manual injection
```

### ✅ When to Use
- For controllers that don't initialize properly with module.get()
- When you need maximum control over instances
- For small, isolated unit tests

### ⚠️ Limitations
- Doesn't verify NestJS's actual DI configuration
- Requires manual dependency management

## 🔧 2. Emergency Override Approach

**Context**: When mocks aren't automatically injected.

### Implementation

```typescript
if (!authService['dependency']) {
  authService['dependency'] = mockDependency;
}
```

### ✅ When to Use
- When mocks don't persist after module.get()
- For private dependencies that can't be normally injected
- As a last resort after trying other methods

### ⚠️ Limitations
- Fragile (depends on internal property names)
- May hide real configuration issues

### 📚 Quick Decision Guide


|Situation|Recommended Approach|Example|
|-|-|-|
|Testing simple services|Direct manual injection|`new Service(deps)`|
|Testing controllers|Manual injection|`new Controller(service)`|
|Non-injected dependencies in tests|Emergency override|`service['dep'] = mock`|
|Minimal integration testing|Normal `module.get()`|`module.get(Service)`|

### 🛠️ Reusable Test Template
```typescript
import { Test } from '@nestjs/testing';
import { beforeEach, describe, it, vi } from 'vitest';
import { MyController } from './my.controller';
import { MyService } from './my.service';

describe('MyController', () => {
  let controller: MyController;
  const mockService = {
    getData: vi.fn().mockReturnValue('mock-data')
  };

  beforeEach(async () => {
    // Option 1: Standard setup
    const module = await Test.createTestingModule({
      controllers: [MyController],
      providers: [
        { provide: MyService, useValue: mockService }
      ],
    }).compile();

    // Option 2: Alternative manual injection
    controller = new MyController(mockService);
    
    // Option 3: Emergency override
    if (!controller['service']) {
      controller['service'] = mockService;
    }
  });

  it('should work', () => {
    expect(controller.getData()).toBe('mock-data');
  });
});
```

### 💡 Final Recommendations
1. **Always start with the standard approach (`module.get()`)**:
```typescript
controller = module.get<MyController>(MyController);
```

2. **If it fails**, try manual injection:
```typescript
controller = new MyController(mockService);
```

3. **As a last resort**, use override:
```typescript
controller['service'] = mockService;
```

4. **Document** your approach in each test:
```typescript
// NOTE: Using manual injection due to Vitest-NestJS DI issues
```

### 🔮 Future Improvements

These workarounds are temporary. As Vitest and NestJS improve their integration, you can gradually migrate to standard approaches.
