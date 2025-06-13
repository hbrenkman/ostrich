// Remove "use client" from the top since this will be a server component

import React from 'react';
import { ProposalClient } from './components/proposal-client';

export default function ProposalPage() {
  return <ProposalClient />;
}