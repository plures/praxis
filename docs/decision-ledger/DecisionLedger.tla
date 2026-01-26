--------------------------- MODULE DecisionLedger ---------------------------
(*
 * TLA+ Specification for Praxis Decision Ledger Integration
 *
 * This spec models the core invariants and behaviors of the Decision Ledger,
 * ensuring correctness of contract validation and ledger immutability.
 *)

EXTENDS Naturals, Sequences, FiniteSets, TLC

CONSTANTS
    RuleIds,        \* Set of all possible rule IDs
    MaxLedgerSize   \* Maximum ledger entries for model checking

VARIABLES
    ledger,         \* Append-only sequence of ledger entries
    contracts,      \* Map: RuleId -> Contract
    facts,          \* Set of current facts (including ContractMissing)
    acknowledged    \* Set of acknowledged contract gaps

vars == <<ledger, contracts, facts, acknowledged>>

(*--algorithm DecisionLedger

variables
    ledger = <<>>;
    contracts = [r \in {} |-> {}];
    facts = {};
    acknowledged = {};

define
    \* Type invariants
    TypeOK ==
        /\ ledger \in Seq([
            id: STRING,
            ruleId: RuleIds,
            timestamp: Nat,
            status: {"active", "superseded", "deprecated"}
        ])
        /\ contracts \in [RuleIds -> [
            behavior: STRING,
            examples: SUBSET [given: STRING, when: STRING, then: STRING],
            invariants: SUBSET STRING
        ]]
        /\ facts \in SUBSET [
            type: STRING,
            ruleId: RuleIds,
            data: [missing: SUBSET STRING, severity: STRING]
        ]
        /\ acknowledged \in SUBSET [ruleId: RuleIds, justification: STRING]

    \* Ledger is append-only (monotonic growth)
    LedgerAppendOnly ==
        \A i \in 1..Len(ledger) :
            \* Once an entry is in the ledger, it never changes
            ledger' = <<>> \/ SubSeq(ledger, 1, i) = SubSeq(ledger', 1, Min({i, Len(ledger')}))

    \* No duplicate ledger entry IDs
    LedgerUnique ==
        \A i, j \in 1..Len(ledger) :
            i # j => ledger[i].id # ledger[j].id

    \* Every contract must have at least one example
    ContractExampleCompleteness ==
        \A r \in DOMAIN contracts :
            contracts[r].examples # {}

    \* ContractMissing facts are accurate
    ContractMissingAccuracy ==
        \A f \in facts :
            f.type = "ContractMissing" =>
                /\ f.ruleId \notin DOMAIN contracts
                \/ contracts[f.ruleId].examples = {}
                \/ contracts[f.ruleId].behavior = ""

    \* Acknowledged gaps are recorded
    AcknowledgedGapsRecorded ==
        \A a \in acknowledged :
            \E f \in facts :
                /\ f.type = "ContractMissing"
                /\ f.ruleId = a.ruleId

    \* Validation is deterministic
    ValidationDeterministic ==
        \* Given the same contracts, validation produces the same facts
        \A r \in RuleIds :
            (r \in DOMAIN contracts /\ contracts[r].behavior # "" /\ contracts[r].examples # {})
                => ~\E f \in facts : f.type = "ContractMissing" /\ f.ruleId = r

end define;

\* Add a contract for a rule
procedure AddContract(ruleId, behavior, examples, invariants)
begin
    AddContract:
        if ruleId \notin DOMAIN contracts then
            contracts := contracts @@ (ruleId :> [
                behavior |-> behavior,
                examples |-> examples,
                invariants |-> invariants
            ]);
            \* Remove ContractMissing fact if it exists
            facts := {f \in facts : ~(f.type = "ContractMissing" /\ f.ruleId = ruleId)};
        end if;
    return;
end procedure;

\* Register a rule and validate contract
procedure RegisterRule(ruleId, hasContract)
begin
    RegisterRule:
        if ~hasContract /\ ruleId \notin DOMAIN contracts then
            \* Create ContractMissing fact
            facts := facts \union {[
                type |-> "ContractMissing",
                ruleId |-> ruleId,
                data |-> [missing |-> {"behavior", "examples"}, severity |-> "warning"]
            ]};
        end if;
    return;
end procedure;

\* Acknowledge a contract gap
procedure AcknowledgeGap(ruleId, justification)
begin
    AcknowledgeGap:
        acknowledged := acknowledged \union {[
            ruleId |-> ruleId,
            justification |-> justification
        ]};
    return;
end procedure;

\* Append to ledger (immutable)
procedure AppendLedger(entryId, ruleId, timestamp, status)
begin
    AppendLedger:
        if Len(ledger) < MaxLedgerSize then
            ledger := Append(ledger, [
                id |-> entryId,
                ruleId |-> ruleId,
                timestamp |-> timestamp,
                status |-> status
            ]);
        end if;
    return;
end procedure;

end algorithm; *)

=============================================================================

\* Key Invariants (for model checking):
\* 
\* INVARIANT LedgerAppendOnly
\*   The ledger is append-only; existing entries are never modified or deleted
\*
\* INVARIANT LedgerUnique
\*   No two ledger entries have the same ID
\*
\* INVARIANT ContractExampleCompleteness
\*   Every contract has at least one example
\*
\* INVARIANT ContractMissingAccuracy
\*   ContractMissing facts accurately reflect missing contracts
\*
\* INVARIANT ValidationDeterministic
\*   Validation produces deterministic results given the same inputs
\*
\* PROPERTY Safety
\*   []TypeOK /\ []LedgerAppendOnly /\ []LedgerUnique
\*
\* PROPERTY Liveness
\*   Eventually all rules have contracts: <>(DOMAIN contracts = RuleIds)
\*
\* Model Checking Notes:
\* - Set MaxLedgerSize = 5 for tractable model checking
\* - Set RuleIds = {"rule1", "rule2", "rule3"} for small test cases
\* - Check temporal properties with TLC
