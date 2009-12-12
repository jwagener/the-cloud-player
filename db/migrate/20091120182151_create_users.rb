class CreateUsers < ActiveRecord::Migration
  def self.up
    create_table :users do |t|
      t.string :username
      t.string :identity_url
      t.integer :remote_user_id
      t.string :key
      t.string :secret
  
      t.timestamps
    end
  end

  def self.down
    drop_table :users
  end
end
