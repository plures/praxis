# Praxis for C#

[![NuGet](https://img.shields.io/nuget/v/Plures.Praxis.svg)](https://www.nuget.org/packages/Plures.Praxis/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The Full Plures Application Framework for C#** – A functional, immutable implementation of the Praxis protocol for .NET.

## Overview

Praxis for C# brings the powerful Praxis application framework to .NET developers. Built with modern C# features (records, pattern matching, nullable reference types), it provides:

- **Declarative Logic**: Define your application logic through facts, events, rules, and constraints
- **Immutable by Default**: All state transitions produce new immutable state objects
- **Type-Safe**: Full use of C# generics and nullable reference types
- **Cross-Platform Compatible**: JSON-serializable protocol for interoperability with TypeScript and other implementations
- **Protocol Version 1.0.0**: Full compatibility with the TypeScript Praxis implementation

## Installation

### NuGet

```bash
dotnet add package Plures.Praxis
```

### PackageReference

```xml
<PackageReference Include="Plures.Praxis" Version="1.0.0" />
```

## Quick Start

```csharp
using Praxis.Core;
using Praxis.Dsl;

// Define the context type
record AuthContext(string? CurrentUser);

// Define facts and events
var UserLoggedIn = PraxisDsl.DefineFact<UserPayload>("UserLoggedIn");
var Login = PraxisDsl.DefineEvent<LoginPayload>("LOGIN");

record UserPayload(string UserId);
record LoginPayload(string Username);

// Define rules
var loginRule = PraxisDsl.DefineRule<AuthContext>(
    id: "auth.login",
    description: "Process login event",
    impl: (state, context, events) =>
    {
        var loginEvent = events.FindEvent(Login);
        if (loginEvent != null)
        {
            var payload = Login.GetPayload(loginEvent);
            return [UserLoggedIn.Create(new UserPayload(payload?.Username ?? "unknown"))];
        }
        return [];
    });

// Create registry and engine
var registry = new PraxisRegistry<AuthContext>();
registry.RegisterRule(loginRule);

var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
{
    InitialContext = new AuthContext(null),
    Registry = registry
});

// Dispatch events
var result = engine.Step([Login.Create(new LoginPayload("alice"))]);
Console.WriteLine($"Facts: {result.State.Facts.Count}"); // Facts: 1
```

## Core Concepts

### Facts

Facts are immutable propositions about the domain. They represent truths in the system.

```csharp
// Define a fact type
var CartItem = PraxisDsl.DefineFact<CartItemPayload>("CartItem");

record CartItemPayload(string ProductId, int Quantity, decimal Price);

// Create a fact
var fact = CartItem.Create(new CartItemPayload("prod-123", 2, 29.99m));

// Check if a fact matches a definition
if (CartItem.Is(fact))
{
    var payload = CartItem.GetPayload(fact);
    Console.WriteLine($"Product: {payload?.ProductId}");
}
```

### Events

Events drive state changes. They are temporally ordered and processed by rules.

```csharp
// Define an event type
var AddToCart = PraxisDsl.DefineEvent<AddToCartPayload>("ADD_TO_CART");

record AddToCartPayload(string ProductId, int Quantity);

// Create an event
var evt = AddToCart.Create(new AddToCartPayload("prod-123", 2));
```

### Rules

Rules are pure functions that derive new facts from the current state and events.

```csharp
var addToCartRule = PraxisDsl.DefineRule<CartContext>(
    id: "cart.addItem",
    description: "Process add to cart event",
    impl: (state, context, events) =>
    {
        var addEvent = events.FindEvent(AddToCart);
        if (addEvent != null)
        {
            var payload = AddToCart.GetPayload(addEvent);
            // Create a new CartItem fact
            return [CartItem.Create(new CartItemPayload(
                payload?.ProductId ?? "", 
                payload?.Quantity ?? 0,
                GetPrice(payload?.ProductId)))];
        }
        return [];
    });
```

### Constraints

Constraints are invariants that must hold true. They validate state after rule execution.

```csharp
var maxCartItems = PraxisDsl.DefineConstraint<CartContext>(
    id: "cart.maxItems",
    description: "Cart cannot exceed 100 items",
    impl: (state, context) =>
    {
        var itemCount = state.Facts.Count(f => f.Tag == "CartItem");
        return itemCount <= 100 
            ? ConstraintResult.Success 
            : ConstraintResult.Failure($"Cart has {itemCount} items, maximum is 100");
    });
```

### Modules

Bundle related rules and constraints together.

```csharp
var cartModule = PraxisDsl.DefineModule<CartContext>(
    rules: [addToCartRule, removeFromCartRule],
    constraints: [maxCartItems, positiveQuantity],
    meta: new Dictionary<string, object> { ["version"] = "1.0.0" }
);

registry.RegisterModule(cartModule);
```

## Introspection

Praxis provides introspection capabilities for examining and visualizing your logic.

```csharp
var introspector = Introspector.Create(registry);

// Get statistics
var stats = introspector.GetStats();
Console.WriteLine($"Rules: {stats.RuleCount}, Constraints: {stats.ConstraintCount}");

// Search rules
var authRules = introspector.SearchRules("auth");

// Generate JSON schema
var schema = introspector.GenerateSchema(PraxisProtocol.Version);

// Export to Graphviz DOT format
var dot = introspector.ExportDot();
File.WriteAllText("registry.dot", dot);

// Export to Mermaid format
var mermaid = introspector.ExportMermaid();
```

## Cross-Language Compatibility

Praxis for C# is fully compatible with the TypeScript implementation. States, facts, and events serialize to JSON in the same format.

```csharp
using System.Text.Json;

// Serialize state to JSON
var json = JsonSerializer.Serialize(engine.GetState());

// Deserialize state from JSON
var state = JsonSerializer.Deserialize<PraxisState>(json);
```

### Protocol Version

Both implementations use the same protocol version (currently 1.0.0) to ensure compatibility:

```csharp
Console.WriteLine(PraxisProtocol.Version); // "1.0.0"
```

## Requirements

- .NET 8.0 or later
- C# 12 or later (for collection expressions and primary constructors)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../CONTRIBUTING.md) to get started.

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Praxis** – Because application logic should be practical, provable, and portable.
