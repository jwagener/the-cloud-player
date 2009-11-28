class AddSoundcloudIdToSoundcloudUsers < ActiveRecord::Migration
  def self.up
    add_column :soundcloud_users, :soundcloud_id, :integer
  end

  def self.down
    remove_column :soundcloud_users, :soundcloud_id
  end
end
