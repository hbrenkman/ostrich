No, I wouldn't recommend creating all files from scratch. Here's why and what I recommend instead:

1. **Why Not Start from Scratch**:
   - The current codebase has working business logic
   - There's existing UI/UX that users are familiar with
   - We have established workflows and validations
   - The current components have been tested in production
   - We'd lose valuable business logic and edge case handling

2. **Better Approach**:
   Let's follow a systematic refactoring strategy:

   a. **Phase 1: Type System Update**
   - Create the central types file first
   - Keep existing components working
   - Add new types alongside old ones
   - This gives us a safety net

   b. **Phase 2: Component-by-Component Refactor**
   - Start with leaf components (those with few dependencies)
   - Update one component at a time
   - Keep the same component structure
   - Just update the type imports and usage
   - Example order:
     1. `ProposalStatus.tsx` (simple status display)
     2. `ProposalContact.tsx` (contact handling)
     3. `ProposalActions.tsx` (status actions)
     4. `ProposalData.tsx` (main data component)
     5. `page.tsx` (page component)

   c. **Phase 3: API Layer Update**
   - Update API routes to use new types
   - Keep backward compatibility
   - Add proper type checking
   - Update response formats

3. **Specific Component Strategy**:
   ```
   src/app/projects/[id]/proposals/[proposalId]/
   ├── page.tsx                    # Update last (depends on all others)
   ├── components/
   │   ├── ProposalStatus.tsx      # Update first (simple, isolated)
   │   ├── ProposalContact.tsx     # Update second
   │   ├── ProposalActions.tsx     # Update third
   │   ├── ProposalData.tsx        # Update fourth
   │   └── space-dialog.tsx        # Update as needed
   ```

4. **Testing Strategy**:
   - Keep existing tests
   - Add new tests for type safety
   - Test each component after refactor
   - Verify all workflows still work
   - Check edge cases

Would you like me to:
1. Start with creating the central types file?
2. Begin with a specific component refactor?
3. Create a more detailed component-by-component plan?

The key is to maintain a working system while we improve it, rather than rebuilding from scratch.