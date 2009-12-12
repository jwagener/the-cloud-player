class CreatePlaylistListings < ActiveRecord::Migration
  def self.up
    create_table :playlist_listings do |t|
      t.integer :user_id
      t.integer :playlist_id
      t.integer :position
      
      
      
      t.boolean :accessable, :nil => false, :default => true
      
      # not migrated yet
      t.boolean :read_only, :nil => false, :default => true
      
      # not used yet
      t.string  :permission, :nil => false, :default => ""
      
      t.timestamps
    end
  end

  def self.down
    drop_table :playlist_listings
  end
end
