class CreatePlaylists < ActiveRecord::Migration
  def self.up
    create_table :playlists do |t|
      t.integer :user_id
      t.integer :access_token_id
      t.string :identifier
      t.string :location

      t.timestamps
    end
  end

  def self.down
    drop_table :playlists
  end
end
