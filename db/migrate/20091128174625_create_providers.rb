class CreateProviders < ActiveRecord::Migration
  def self.up
    create_table :providers do |t|
      t.string :name
      t.string :icon_src
      t.string :host
      t.string :access_token_path
      t.string :request_token_path
      t.string :authorize_path
    
      t.string :consumer_token
      t.string :consumer_secret
    
      t.boolean :supports_discovery ,                 :nil => false, :default => false
      t.boolean :supports_oauth ,                     :nil => false, :default => false
      t.boolean :supports_oauth_static_consumer ,     :nil => false, :default => false
      t.boolean :supports_xspf_discovery ,            :nil => false, :default => false
      t.boolean :supports_xspf_opensearch ,           :nil => false, :default => false
      
      t.string :xspf_discovery_path
      t.string :xspf_opensearch_query_template
    
      t.timestamps
    end
  end

  def self.down
    drop_table :providers
  end
end
