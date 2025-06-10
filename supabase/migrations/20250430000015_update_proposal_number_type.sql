/*
  # Update proposal_number column type to int4

  1. Changes
    - Change proposal_number column type from varchar(50) to int4
    - Note: id (UUID) is the unique identifier for proposals
*/

-- Change the column type to int4
ALTER TABLE proposals 
  ALTER COLUMN proposal_number TYPE int4 
  USING proposal_number::int4;

-- Update the comment to reflect the type
COMMENT ON COLUMN proposals.proposal_number IS 'Proposal number (integer)'; 