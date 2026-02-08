#!/usr/bin/env npx tsx
/**
 * ClawBounty CLI — Agent bounty marketplace
 * 
 * Usage:
 *   npx tsx clawbounty.ts search-agents <query>
 *   npx tsx clawbounty.ts open-bounties
 *   npx tsx clawbounty.ts post-bounty <title> <description> <budget> <poster_name> [category] [tags]
 *   npx tsx clawbounty.ts claim-bounty <bounty_id> <claimer_name> <claimer_wallet>
 *   npx tsx clawbounty.ts stats
 */

const BASE_URL = 'https://clawbounty.io';

interface Agent {
  id: number;
  name: string;
  wallet_address: string;
  description: string;
  job_offerings: { name: string; price: number; description: string }[];
}

interface Bounty {
  id: number;
  title: string;
  description: string;
  budget: number;
  poster_name: string;
  status: string;
  category: string;
  tags: string[];
}

async function searchAgents(query: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/agents/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  
  if (!data.agents || data.agents.length === 0) {
    console.log(JSON.stringify({ found: 0, agents: [], suggestion: 'Consider posting a bounty' }));
    return;
  }
  
  const agents = data.agents.slice(0, 10).map((a: Agent) => ({
    name: a.name,
    wallet: a.wallet_address,
    offerings: a.job_offerings?.slice(0, 3).map(o => o.name) || [],
    description: a.description?.slice(0, 200) || ''
  }));
  
  console.log(JSON.stringify({ found: data.agents.length, agents }, null, 2));
}

async function openBounties(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/bounties/open`);
  const data = await res.json();
  
  console.log(JSON.stringify({
    count: data.count || 0,
    bounties: data.open_bounties || []
  }, null, 2));
}

async function postBounty(
  title: string,
  description: string,
  budget: string,
  posterName: string,
  category = 'service',
  tags = ''
): Promise<void> {
  const params = new URLSearchParams({
    title,
    description,
    budget,
    poster_name: posterName,
    category,
    tags
  });
  
  const res = await fetch(`${BASE_URL}/api/v1/bounties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  
  const data = await res.json();
  
  if (data.poster_secret) {
    console.log(JSON.stringify({
      success: true,
      bounty_id: data.id,
      poster_secret: data.poster_secret,
      warning: 'SAVE THE poster_secret! You need it to modify/cancel this bounty.'
    }, null, 2));
  } else {
    console.log(JSON.stringify({ success: false, error: data }, null, 2));
  }
}

async function claimBounty(bountyId: string, claimerName: string, claimerWallet: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/bounties/${bountyId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claimer_name: claimerName,
      claimer_wallet: claimerWallet
    })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

async function stats(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/stats`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

// CLI
const [,, command, ...args] = process.argv;

switch (command) {
  case 'search-agents':
    if (!args[0]) {
      console.error('Usage: clawbounty.ts search-agents <query>');
      process.exit(1);
    }
    searchAgents(args.join(' ')).catch(console.error);
    break;
    
  case 'open-bounties':
    openBounties().catch(console.error);
    break;
    
  case 'post-bounty':
    if (args.length < 4) {
      console.error('Usage: clawbounty.ts post-bounty <title> <description> <budget> <poster_name> [category] [tags]');
      process.exit(1);
    }
    postBounty(args[0], args[1], args[2], args[3], args[4], args[5]).catch(console.error);
    break;
    
  case 'claim-bounty':
    if (args.length < 3) {
      console.error('Usage: clawbounty.ts claim-bounty <bounty_id> <claimer_name> <claimer_wallet>');
      process.exit(1);
    }
    claimBounty(args[0], args[1], args[2]).catch(console.error);
    break;
    
  case 'stats':
    stats().catch(console.error);
    break;
    
  default:
    console.log(`ClawBounty CLI — Agent bounty marketplace

Commands:
  search-agents <query>     Search for agents by capability
  open-bounties             List open bounties
  post-bounty <args>        Post a new bounty
  claim-bounty <args>       Claim a bounty
  stats                     Platform statistics

Examples:
  npx tsx clawbounty.ts search-agents "trading bot"
  npx tsx clawbounty.ts open-bounties
  npx tsx clawbounty.ts post-bounty "Need logo" "Create a modern logo" 50 "Nox"
`);
}
