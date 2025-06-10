/*
  # Add unique constraint on proposal_number

  1. Changes
    - Add unique constraint on proposal_number column
    - Add comment to explain the constraint
*/

-- Add unique constraint
ALTER TABLE proposals
ADD CONSTRAINT proposals_proposal_number_key UNIQUE (proposal_number);

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT proposals_proposal_number_key ON proposals 
IS 'Ensures each proposal has a unique proposal number'; 