exports.up = async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.string('openid', 128).notNullable().unique();
    table.string('nickname', 64).nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('images', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').unsigned().nullable();
    table.string('original_url', 255).notNullable();
    table.string('preview_url', 255).nullable();
    table.string('hd_url', 255).nullable();
    table.string('bg_color', 16).nullable();
    table.string('size_type', 32).nullable();
    table.string('status', 32).notNullable().defaultTo('uploaded');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('orders', (table) => {
    table.bigIncrements('id').primary();
    table.string('order_no', 64).notNullable().unique();
    table.bigInteger('user_id').unsigned().nullable();
    table.bigInteger('image_id').unsigned().notNullable();
    table.integer('amount_cents').notNullable();
    table.string('currency', 8).notNullable().defaultTo('CNY');
    table.string('payment_status', 32).notNullable().defaultTo('unpaid');
    table.string('payment_channel', 32).nullable();
    table.string('wx_prepay_id', 128).nullable();
    table.timestamps(true, true);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('images');
  await knex.schema.dropTableIfExists('users');
};
