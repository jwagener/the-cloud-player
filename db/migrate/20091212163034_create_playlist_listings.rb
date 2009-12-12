class CreatePlaylistListings < ActiveRecord::Migration
  def self.up
    create_table :playlist_listings do |t|
      t.integer :user_id
      t.integer :playlist_id
      t.integer :position

      t.timestamps
    end
  end

  def self.down
    drop_table :playlist_listings
  end
end
