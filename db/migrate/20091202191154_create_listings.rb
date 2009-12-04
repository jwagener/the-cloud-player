class CreateListings < ActiveRecord::Migration
  def self.up
    create_table :listings do |t|
      t.integer :playlist_id
      t.integer :track_id
      t.integer :position

      t.timestamps
    end
  end

  def self.down
    drop_table :listings
  end
end
