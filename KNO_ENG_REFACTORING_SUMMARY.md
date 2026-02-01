# kno-eng Refactoring: Executive Summary

**Date**: 2026-02-01  
**Status**: Planning Complete - Awaiting Approval  
**Issue**: Refactor kno-eng into Praxis: capture/UX layer (no separate sync)

## Overview

This repository now contains comprehensive planning documentation for refactoring the external `kno-eng` (knowledge engineering) tool into Praxis as the new `conversations` module. The refactoring preserves kno-eng's valuable IDE capture and UX capabilities while eliminating redundant sync functionality in favor of Praxis's existing local-first PluresDB architecture.

## Key Documents Created

### 1. [Extraction Plan](./docs/KNO_ENG_EXTRACTION_PLAN.md) (577 lines)
**Purpose**: Comprehensive analysis of what to keep, cut, and defer from kno-eng

**Key Sections**:
- **What to KEEP**: IDE capture/UX, knowledge engineering features, developer experience
- **What to CUT**: Custom sync implementation, redundant persistence, separate auth
- **What to DEFER**: Advanced analytics, collaboration features, external integrations
- **Migration Strategy**: 5-phase implementation plan (10 weeks)
- **Technical Decisions**: Storage (PluresDB), UI (Svelte 5), IDE support (VS Code first)
- **Success Metrics**: Functional, performance, and UX targets
- **Risk Mitigation**: Feature parity, performance, adoption, scope creep

**Highlights**:
- Complete data model design (PluresDB schemas)
- File structure blueprint
- Example API usage
- Resource requirements
- Risk analysis

### 2. [Integration Points](./docs/conversations/INTEGRATION_POINTS.md) (719 lines)
**Purpose**: Detailed technical specification of how kno-eng integrates into Praxis

**Key Sections**:
- **Data Layer**: PluresDB schema definitions with full TypeScript implementations
- **Logic Engine**: Facts, events, and processing rules integration
- **UI Components**: Svelte 5 component generation and custom components
- **CLI Integration**: Knowledge management commands
- **Sync Integration**: PluresDB + Praxis Cloud configuration
- **IDE Extension**: VS Code extension architecture with code samples
- **Testing**: Test infrastructure and examples

**Highlights**:
- Complete code examples for every integration point
- Architecture diagrams
- Database initialization code
- VS Code extension implementation
- Test infrastructure setup

### 3. [Conversations Module README](./docs/conversations/README.md) (168 lines)
**Purpose**: User-facing documentation for the new conversations module

**Key Sections**:
- Module overview and features
- API preview and usage examples
- CLI commands
- Migration guide from kno-eng
- Roadmap (Phases 1-5)
- FAQ

**Highlights**:
- Developer-friendly quick start
- Clear migration path for existing kno-eng users
- Timeline expectations (Q2 2026 - Q2 2027)

## Deliverables Summary

✅ **Extraction Plan**: What to keep/cut/defer from kno-eng  
✅ **Integration Points**: Target integration points into praxis-conversations  
✅ **API Design**: Preview of conversations module API  
✅ **Migration Strategy**: 5-phase implementation roadmap  
✅ **Technical Specifications**: Complete code examples for all integration points  
✅ **Risk Analysis**: Identified risks and mitigation strategies  
✅ **Success Metrics**: Quantifiable targets for functional, performance, and UX goals

## Architecture Summary

### Core Value Proposition
Transform kno-eng from a standalone tool with custom sync into a first-class Praxis module that:
1. **Preserves**: IDE capture, UX, knowledge engineering features
2. **Leverages**: Praxis's local-first PluresDB, logic engine, component system
3. **Eliminates**: Redundant sync, storage, and auth implementations
4. **Integrates**: CLI, VS Code extension, Svelte UI, Praxis Cloud

### Integration Model

```
kno-eng Capabilities
    ↓
┌─────────────────────────────────┐
│  Praxis Conversations Module    │
├─────────────────────────────────┤
│  Capture │ Knowledge │ Sync     │
└────┬──────────┬───────────┬─────┘
     │          │           │
     ▼          ▼           ▼
PluresDB    Logic       Praxis
(Storage)   Engine      Cloud
            (Rules)     (Sync)
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage** | PluresDB | Already integrated, local-first, CRDT-based |
| **UI Framework** | Svelte 5 | Praxis standard, component generation |
| **IDE Support** | VS Code first | Broader user base, easier integration |
| **Sync Protocol** | PluresDB + Unum | Don't reinvent, proven architecture |
| **Module Structure** | `/src/conversations` | First-class feature in praxis core |

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Core infrastructure and PluresDB schemas
- Basic CLI commands
- Praxis rules for knowledge processing

### Phase 2: IDE Integration (Weeks 3-4)
- VS Code extension with PluresDB integration
- Code context extraction
- Local-first functionality

### Phase 3: UI Components (Weeks 5-6)
- Svelte components generation
- Knowledge graph visualization
- Search and navigation interfaces

### Phase 4: Sync & Collaboration (Weeks 7-8)
- Praxis Cloud integration
- Team knowledge sharing
- Conflict resolution testing

### Phase 5: Polish & Documentation (Weeks 9-10)
- User documentation
- Migration guide for kno-eng users
- Performance optimization

## Success Criteria

### Must Have
- [x] Complete extraction plan
- [x] Integration architecture defined
- [ ] Stakeholder approval
- [ ] Phase 1 implementation complete
- [ ] VS Code extension working
- [ ] Knowledge syncs via PluresDB

### Performance Targets
- Capture latency: < 50ms
- Search (10k entries): < 100ms
- Sync (typical): < 1s
- VS Code extension load: < 200ms

### User Experience
- < 3 clicks to capture knowledge
- Zero config for local-first usage
- < 5 min setup for cloud sync
- Keyboard shortcuts for all common actions

## Migration Path for kno-eng Users

1. **Compatibility Layer**: Provides kno-eng API compatibility
2. **Migration Tool**: `praxis knowledge migrate --from kno-eng`
3. **Gradual Transition**: kno-eng maintained for 6 months post-release
4. **Clear Benefits**: Better sync, cloud backup, team collaboration

## Next Steps

1. **Review**: Stakeholder review of planning documents ← **YOU ARE HERE**
2. **Approval**: Get sign-off to proceed with Phase 1
3. **Prototype**: Build Phase 1 prototype (1 week)
4. **Beta**: Recruit 10 beta testers from kno-eng community
5. **Implement**: Execute 10-week implementation plan

## Resources

- **Main Extraction Plan**: [docs/KNO_ENG_EXTRACTION_PLAN.md](./docs/KNO_ENG_EXTRACTION_PLAN.md)
- **Integration Points**: [docs/conversations/INTEGRATION_POINTS.md](./docs/conversations/INTEGRATION_POINTS.md)
- **Module README**: [docs/conversations/README.md](./docs/conversations/README.md)
- **PluresDB Integration**: [docs/core/pluresdb-integration.md](./docs/core/pluresdb-integration.md)
- **Praxis Framework**: [FRAMEWORK.md](./FRAMEWORK.md)

## Questions or Feedback?

Please review the detailed documentation and provide feedback on:
1. Scope: Is the keep/cut/defer analysis correct?
2. Architecture: Are the integration points appropriate?
3. Timeline: Is the 10-week implementation realistic?
4. Risks: Have we identified all major risks?
5. Migration: Is the migration path clear for existing users?

---

**Planning Complete**: 2026-02-01  
**Total Documentation**: 1,464 lines across 3 documents  
**Status**: Ready for stakeholder review and approval
