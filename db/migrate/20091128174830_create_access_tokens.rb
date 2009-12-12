class CreateAccessTokens < ActiveRecord::Migration
  def self.up
    create_table :access_tokens do |t|
      t.integer :user_id
      t.integer :provider_id
      t.integer :remote_user_id
      
      
      t.string :username
      t.string :key
      t.string :secret
      
      t.timestamps
    end
  end

  def self.down
    drop_table :access_tokens
  end
end
