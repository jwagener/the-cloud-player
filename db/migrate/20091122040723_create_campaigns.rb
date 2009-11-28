class CreateCampaigns < ActiveRecord::Migration
  def self.up
    create_table :campaigns do |t|
      t.integer :soundcloud_user_id
      t.string :track_url

      t.timestamps
    end
  end

  def self.down
    drop_table :campaigns
  end
end
