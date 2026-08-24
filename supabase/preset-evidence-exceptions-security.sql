-- The approval function is trigger-only and must not be exposed as an RPC.

revoke execute on function public.enforce_preset_evidence_exception_approval()
  from public, anon, authenticated;
