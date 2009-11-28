class CreateSoundcloudUsers < ActiveRecord::Migration
  def self.up
    create_table :soundcloud_users do |t|
      t.string :username
      t.string :access_token_key
      t.string :access_token_secret

      t.timestamps
    end
  end

  def self.down
    drop_table :soundcloud_users
  end
end
