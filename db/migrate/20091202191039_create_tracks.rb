class CreateTracks < ActiveRecord::Migration
  def self.up
    create_table :tracks do |t|
      t.string :identifier
      t.string :location
      t.string :title
      t.string :creator
      t.string :image

      t.timestamps
    end
  end

  def self.down
    drop_table :tracks
  end
end
