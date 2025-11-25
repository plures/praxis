// <copyright file="ProtocolTests.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using System.Text.Json;
using Praxis.Core;
using Xunit;

namespace Praxis.Tests;

public class ProtocolTests
{
    [Fact]
    public void ProtocolVersion_ShouldBeOnePointZero()
    {
        Assert.Equal("1.0.0", PraxisProtocol.Version);
    }

    [Fact]
    public void PraxisFact_Create_ShouldCreateFactWithPayload()
    {
        var payload = new { userId = "123", name = "Alice" };
        var fact = PraxisFact.Create("UserLoggedIn", payload);

        Assert.Equal("UserLoggedIn", fact.Tag);
        Assert.NotEqual(default, fact.Payload);
    }

    [Fact]
    public void PraxisFact_GetPayload_ShouldDeserializePayload()
    {
        var payload = new TestPayload("123", "Alice");
        var fact = PraxisFact.Create("UserLoggedIn", payload);

        var retrieved = fact.GetPayload<TestPayload>();

        Assert.NotNull(retrieved);
        Assert.Equal("123", retrieved.UserId);
        Assert.Equal("Alice", retrieved.Name);
    }

    [Fact]
    public void PraxisEvent_Create_ShouldCreateEventWithPayload()
    {
        var payload = new { username = "alice", password = "secret" };
        var evt = PraxisEvent.Create("LOGIN", payload);

        Assert.Equal("LOGIN", evt.Tag);
        Assert.NotEqual(default, evt.Payload);
    }

    [Fact]
    public void PraxisEvent_GetPayload_ShouldDeserializePayload()
    {
        var payload = new LoginPayload("alice", "secret");
        var evt = PraxisEvent.Create("LOGIN", payload);

        var retrieved = evt.GetPayload<LoginPayload>();

        Assert.NotNull(retrieved);
        Assert.Equal("alice", retrieved.Username);
        Assert.Equal("secret", retrieved.Password);
    }

    [Fact]
    public void PraxisState_Create_ShouldCreateStateWithContext()
    {
        var context = new TestContext("test-user");
        var state = PraxisState.Create(context);

        Assert.NotEqual(default, state.Context);
        Assert.Empty(state.Facts);
        Assert.Equal(PraxisProtocol.Version, state.ProtocolVersion);
    }

    [Fact]
    public void PraxisState_GetContext_ShouldDeserializeContext()
    {
        var context = new TestContext("test-user");
        var state = PraxisState.Create(context);

        var retrieved = state.GetContext<TestContext>();

        Assert.NotNull(retrieved);
        Assert.Equal("test-user", retrieved.CurrentUser);
    }

    [Fact]
    public void PraxisState_WithContext_ShouldCreateNewStateWithUpdatedContext()
    {
        var context = new TestContext(null);
        var state = PraxisState.Create(context);

        var newState = state.WithContext(new TestContext("alice"));

        var retrieved = newState.GetContext<TestContext>();
        Assert.NotNull(retrieved);
        Assert.Equal("alice", retrieved.CurrentUser);
    }

    [Fact]
    public void PraxisState_WithFacts_ShouldCreateNewStateWithAddedFacts()
    {
        var state = PraxisState.Create(new TestContext(null));
        var fact = PraxisFact.Create("TestFact", new { value = 42 });

        var newState = state.WithFacts([fact]);

        Assert.Single(newState.Facts);
        Assert.Equal("TestFact", newState.Facts[0].Tag);
    }

    [Fact]
    public void PraxisDiagnostics_ShouldStoreKindAndMessage()
    {
        var diag = new PraxisDiagnostics(
            Kind: DiagnosticKind.ConstraintViolation,
            Message: "Test violation");

        Assert.Equal(DiagnosticKind.ConstraintViolation, diag.Kind);
        Assert.Equal("Test violation", diag.Message);
    }

    [Fact]
    public void PraxisStepConfig_ShouldStoreRuleAndConstraintIds()
    {
        var config = new PraxisStepConfig(
            RuleIds: ["rule1", "rule2"],
            ConstraintIds: ["constraint1"]);

        Assert.Equal(2, config.RuleIds.Count);
        Assert.Single(config.ConstraintIds);
    }

    [Fact]
    public void Protocol_ShouldSerializeToJson()
    {
        var fact = PraxisFact.Create("TestFact", new { value = 42 });
        var state = PraxisState.Create(new TestContext("alice"), [fact]);

        var json = JsonSerializer.Serialize(state);
        var deserialized = JsonSerializer.Deserialize<PraxisState>(json);

        Assert.NotNull(deserialized);
        Assert.Single(deserialized.Facts);
        Assert.Equal(PraxisProtocol.Version, deserialized.ProtocolVersion);
    }

    private record TestPayload(string UserId, string Name);
    private record LoginPayload(string Username, string Password);
    private record TestContext(string? CurrentUser);
}
