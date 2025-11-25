// <copyright file="EngineTests.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using Praxis.Core;
using Praxis.Dsl;
using Xunit;

namespace Praxis.Tests;

public class EngineTests
{
    private record AuthContext(string? CurrentUser);
    private record UserPayload(string UserId);
    private record LoginPayload(string Username);

    private static readonly EventDefinition<string, LoginPayload> Login = PraxisDsl.DefineEvent<LoginPayload>("LOGIN");
    private static readonly FactDefinition<string, UserPayload> UserLoggedIn = PraxisDsl.DefineFact<UserPayload>("UserLoggedIn");

    [Fact]
    public void LogicEngine_Create_ShouldInitializeWithContext()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry
        });

        var context = engine.GetContext();

        Assert.Null(context.CurrentUser);
    }

    [Fact]
    public void LogicEngine_Step_ShouldApplyRules()
    {
        var registry = new PraxisRegistry<AuthContext>();
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

        registry.RegisterRule(loginRule);

        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry
        });

        var result = engine.Step([Login.Create(new LoginPayload("alice"))]);

        Assert.Single(result.State.Facts);
        Assert.Equal("UserLoggedIn", result.State.Facts[0].Tag);
        Assert.Empty(result.Diagnostics);
    }

    [Fact]
    public void LogicEngine_Step_ShouldCheckConstraints()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var constraint = PraxisDsl.DefineConstraint<AuthContext>(
            id: "auth.required",
            description: "User must be logged in",
            impl: (state, context) =>
            {
                return context.CurrentUser != null
                    ? ConstraintResult.Success
                    : ConstraintResult.Failure("No user logged in");
            });

        registry.RegisterConstraint(constraint);

        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry
        });

        var result = engine.Step([]);

        Assert.Single(result.Diagnostics);
        Assert.Equal(DiagnosticKind.ConstraintViolation, result.Diagnostics[0].Kind);
        Assert.Equal("No user logged in", result.Diagnostics[0].Message);
    }

    [Fact]
    public void LogicEngine_Step_ShouldReportMissingRules()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry
        });

        var config = new PraxisStepConfig(
            RuleIds: ["nonexistent.rule"],
            ConstraintIds: []);

        var result = engine.StepWithConfig([], config);

        Assert.Single(result.Diagnostics);
        Assert.Equal(DiagnosticKind.RuleError, result.Diagnostics[0].Kind);
        Assert.Contains("not found", result.Diagnostics[0].Message);
    }

    [Fact]
    public void LogicEngine_Step_ShouldHandleRuleErrors()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var faultyRule = new RuleDescriptor<AuthContext>
        {
            Id = "faulty.rule",
            Description = "A rule that throws",
            Impl = (state, context, events) => throw new InvalidOperationException("Test error")
        };

        registry.RegisterRule(faultyRule);

        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry
        });

        var result = engine.Step([]);

        Assert.Single(result.Diagnostics);
        Assert.Equal(DiagnosticKind.RuleError, result.Diagnostics[0].Kind);
        Assert.Contains("Test error", result.Diagnostics[0].Message);
    }

    [Fact]
    public void LogicEngine_UpdateContext_ShouldUpdateContextDirectly()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry
        });

        engine.UpdateContext(ctx => new AuthContext("alice"));

        Assert.Equal("alice", engine.GetContext().CurrentUser);
    }

    [Fact]
    public void LogicEngine_AddFacts_ShouldAddFactsDirectly()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry
        });

        engine.AddFacts([UserLoggedIn.Create(new UserPayload("bob"))]);

        Assert.Single(engine.GetFacts());
    }

    [Fact]
    public void LogicEngine_ClearFacts_ShouldRemoveAllFacts()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry,
            InitialFacts = [UserLoggedIn.Create(new UserPayload("alice"))]
        });

        engine.ClearFacts();

        Assert.Empty(engine.GetFacts());
    }

    [Fact]
    public void LogicEngine_Reset_ShouldRestoreInitialState()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext("alice"),
            Registry = registry
        });

        engine.UpdateContext(ctx => new AuthContext("bob"));
        engine.AddFacts([UserLoggedIn.Create(new UserPayload("bob"))]);

        engine.Reset(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext(null),
            Registry = registry
        });

        Assert.Null(engine.GetContext().CurrentUser);
        Assert.Empty(engine.GetFacts());
    }

    [Fact]
    public void LogicEngine_GetState_ShouldReturnImmutableState()
    {
        var registry = new PraxisRegistry<AuthContext>();
        var engine = PraxisEngine.Create(new PraxisEngineOptions<AuthContext>
        {
            InitialContext = new AuthContext("alice"),
            Registry = registry
        });

        var state = engine.GetState();

        Assert.Equal(PraxisProtocol.Version, state.ProtocolVersion);
        Assert.NotNull(state.GetContext<AuthContext>());
    }
}
