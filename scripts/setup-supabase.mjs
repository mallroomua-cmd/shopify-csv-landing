// scripts/setup-supabase.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_MALLROOM = path.resolve(__dirname, '..');
const ROOT_DUNE = path.resolve(__dirname, '../../dune-clothing-store');

async function run() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.argv[2];
  const directUrl = process.env.VITE_SUPABASE_URL || process.argv[3];
  const directKey = process.env.VITE_SUPABASE_ANON_KEY || process.argv[4];

  console.log('--- SUPABASE AUTO-CONFIGURATOR ---');

  let projectUrl = directUrl;
  let anonKey = directKey;
  let projectRef = '';

  if (token && token.startsWith('sbp_')) {
    console.log('✓ Found Supabase Personal Access Token');
    // 1. Fetch projects
    const listRes = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      throw new Error(`Failed to list projects from Supabase: ${listRes.status} ${err}`);
    }

    const projects = await listRes.json();
    console.log(`Found ${projects.length} existing project(s) in your account.`);

    let targetProject = projects.find(p => p.name?.toLowerCase().includes('mallroom') || p.name?.toLowerCase().includes('dune'));
    if (!targetProject && projects.length > 0) {
      targetProject = projects[0];
    }

    if (!targetProject) {
      console.log('No project found. Creating new project "mallroom-stores"...');
      // Fetch organizations
      const orgsRes = await fetch('https://api.supabase.com/v1/organizations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orgs = await orgsRes.json();
      if (!orgs || orgs.length === 0) {
        throw new Error('No organizations found in Supabase account.');
      }
      const orgId = orgs[0].id;

      // Generate secure db password
      const dbPassword = 'Mr_' + Math.random().toString(36).slice(2, 10) + 'A1!' + Math.random().toString(36).slice(2, 6);

      const createRes = await fetch('https://api.supabase.com/v1/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'mallroom-stores',
          organization_id: orgId,
          region: 'eu-central-1', // Frankfurt
          db_pass: dbPassword
        })
      });

      if (!createRes.ok) {
        throw new Error(`Failed to create project: ${await createRes.text()}`);
      }

      targetProject = await createRes.json();
      console.log(`✓ Created project ${targetProject.name} (${targetProject.id})`);
    }

    projectRef = targetProject.id;
    projectUrl = `https://${projectRef}.supabase.co`;
    console.log(`Target project: ${targetProject.name} (${projectRef}) -> ${projectUrl}`);

    // Wait until project is active or fetch API keys
    console.log('Fetching API keys...');
    let keysRes;
    for (let i = 0; i < 12; i++) {
      keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (keysRes.ok) break;
      console.log('Waiting for project API keys to be ready...');
      await new Promise(r => setTimeout(r, 5000));
    }

    if (!keysRes.ok) {
      throw new Error(`Could not fetch api keys: ${await keysRes.text()}`);
    }

    const apiKeys = await keysRes.json();
    const anon = apiKeys.find(k => k.name === 'anon');
    if (!anon) {
      throw new Error('Anon key not found in project api keys.');
    }
    anonKey = anon.api_key;
    console.log('✓ Retrieved anon public key.');

    // Apply SQL schema via Management API database query
    console.log('Applying SQL schema to Supabase database...');
    const schemaSql = fs.readFileSync(path.join(ROOT_MALLROOM, 'supabase_schema.sql'), 'utf-8');
    const queryRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: schemaSql })
    });

    if (!queryRes.ok) {
      console.warn('Warning: Database query returned status', queryRes.status, await queryRes.text());
    } else {
      console.log('✓ SQL schema applied successfully!');
    }
  }

  if (!projectUrl || !anonKey) {
    throw new Error('Project URL and Anon Key are required! Pass SUPABASE_ACCESS_TOKEN or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  // Write .env to both projects
  const envContent = `# Supabase Cloud Database & Storage Configuration
VITE_SUPABASE_URL=${projectUrl}
VITE_SUPABASE_ANON_KEY=${anonKey}
`;

  fs.writeFileSync(path.join(ROOT_MALLROOM, '.env'), envContent, 'utf-8');
  console.log(`✓ Wrote .env to ${ROOT_MALLROOM}`);

  if (fs.existsSync(ROOT_DUNE)) {
    fs.writeFileSync(path.join(ROOT_DUNE, '.env'), envContent, 'utf-8');
    console.log(`✓ Wrote .env to ${ROOT_DUNE}`);
  }

  console.log('\n--- SUCCESS! ---');
  console.log(`Supabase URL: ${projectUrl}`);
  console.log(`Anon Key: ${anonKey.slice(0, 15)}...${anonKey.slice(-5)}`);
  console.log('Both stores are now connected to Supabase Cloud!');
}

run().catch(err => {
  console.error('\n❌ Error during setup:', err.message);
  process.exit(1);
});
