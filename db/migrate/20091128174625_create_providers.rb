class CreateProviders < ActiveRecord::Migration
  def self.up
    create_table :providers do |t|
      t.string :name
      t.string :icon_src
      t.string :host
      t.string :access_token_path
      t.string :request_token_path
      t.string :xspf_path
    
    
      t.boolean :supports_discovery ,                 :nil => false, :default => false
      t.boolean :supports_oauth ,                     :nil => false, :default => false
      t.boolean :supports_oauth_anonymous_consumer ,  :nil => false, :default => false
      t.boolean :supports_playlist_discovery ,        :nil => false, :default => false
      t.boolean :supports_playlist_search ,           :nil => false, :default => false
    
      t.timestamps
    end
  end

  def self.down
    drop_table :providers
  end
end
