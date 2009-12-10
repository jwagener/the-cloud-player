class CreateTracks < ActiveRecord::Migration
  def self.up
    create_table :tracks do |t|
      t.integer :provider_id
      t.string :identifier
      t.string :location
      t.string :title
      t.integer :duration
      t.string :creator
      t.string :image

      t.boolean :protected, :default => false, :nil => false
      t.timestamps
    end
  end

  def self.down
    drop_table :tracks
  end
end
