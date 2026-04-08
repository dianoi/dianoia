const { Client } = require('pg');

async function seedRemaining() {
  const client = new Client({
    connectionString: 'postgresql://postgres.gxyeobogqfubgzklmxwt:BX882r%26hby3C%21T8T@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase\n');

    // Get Todd's profile ID for created_by
    const todd = await client.query(`
      SELECT id FROM profiles WHERE email = 'todd.y@roots.coop' LIMIT 1
    `);
    const toddId = todd.rows[0]?.id;

    // ========== PROJECTS ==========
    console.log('Seeding projects/ventures...');

    const projects = [
      {name: 'LearnVibe.Build', type: 'venture', description: 'AI capability development using H-LAM/T framework', status: 'completed'},
      {name: 'Information & Communications Commons', type: 'venture', description: 'Knowledge-graph infrastructure connecting convergence events', status: 'active'},
      {name: 'Schelling Point', type: 'venture', description: 'Quadratic voting platform for ETHBoulder 2026', status: 'archived'},
      {name: 'Parachute', type: 'project', description: 'AI startup (venture-in-formation)', status: 'active'},
      {name: 'Postage', type: 'project', description: 'Email protocol (venture-in-formation)', status: 'active'},
      {name: 'Habitat', type: 'project', description: 'Organizational behavior matrix (venture-in-formation)', status: 'active'},
      {name: 'Patronage Accounting Systems', type: 'project', description: 'Studio infrastructure', status: 'active'},
      {name: 'commons.id', type: 'project', description: 'Studio infrastructure', status: 'active'},
      {name: 'co-op.us', type: 'project', description: 'Studio infrastructure', status: 'active'},
      {name: 'Watershed Data Aggregator', type: 'project', description: 'Studio infrastructure', status: 'active'},
      {name: 'Coordination Games Participation', type: 'project', description: 'Studio infrastructure', status: 'active'}
    ];

    for (const p of projects) {
      await client.query(`
        INSERT INTO projects (name, description, type, status, created_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [p.name, p.description, p.type, p.status, toddId]);
    }

    console.log(`✓ ${projects.length} projects seeded`);

    // ========== CAPITAL ACCOUNTS ==========
    console.log('\nSeeding capital accounts...');

    // Get profiles for capital accounts
    const profiles = await client.query(`
      SELECT id, name, email FROM profiles WHERE declared_role = 'organizer'
    `);

    console.log(`Found ${profiles.rows.length} organizer profiles`);

    // Create capital accounts for all organizers
    for (const profile of profiles.rows) {
      // Check if capital account already exists
      const existing = await client.query(`
        SELECT id FROM capital_accounts WHERE member_id = $1
      `, [profile.id]);

      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO capital_accounts (member_id, initial_contribution)
          VALUES ($1, 0)
        `, [profile.id]);
        console.log(`  ✓ Created capital account for ${profile.name}`);
      }
    }

    // Seed specific initial contributions (from Todd's data)
    const contributions = [
      {name: 'Kevin Owocki', email: 'kevin@allo.capital', amount: 50000},
      // Jeremy Wood and Ethereum Foundation might not have profiles yet
    ];

    for (const contrib of contributions) {
      const profile = profiles.rows.find(p => p.email === contrib.email);
      if (profile) {
        await client.query(`
          UPDATE capital_accounts
          SET initial_contribution = $1
          WHERE member_id = $2
        `, [contrib.amount, profile.id]);
        console.log(`  ✓ Set initial contribution for ${contrib.name}: $${contrib.amount.toLocaleString()}`);
      } else {
        console.log(`  ⚠ Profile not found for ${contrib.name} (${contrib.email})`);
      }
    }

    // ========== VERIFICATION ==========
    console.log('\n=== VERIFICATION ===\n');

    const projectCount = await client.query('SELECT COUNT(*) FROM projects');
    console.log(`Projects: ${projectCount.rows[0].count}`);

    const capitalCount = await client.query('SELECT COUNT(*) FROM capital_accounts');
    console.log(`Capital accounts: ${capitalCount.rows[0].count}`);

    const capitalTotal = await client.query(`
      SELECT SUM(initial_contribution) as total FROM capital_accounts
    `);
    console.log(`Total initial capital: $${parseFloat(capitalTotal.rows[0].total || 0).toLocaleString()}`);

    const bankTotal = await client.query(`
      SELECT SUM(balance) as total FROM bank_accounts
    `);
    console.log(`Total bank balances: $${parseFloat(bankTotal.rows[0].total).toLocaleString()}`);

    const cryptoTotal = await client.query(`
      SELECT SUM(usd_value) as total FROM crypto_balances
    `);
    console.log(`Total crypto balances: $${parseFloat(cryptoTotal.rows[0].total).toLocaleString()}`);

    console.log('\n✓ Data seeding complete');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedRemaining();
