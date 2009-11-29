class CreateProviders < ActiveRecord::Migration
  def self.up
    create_table :providers do |t|
      t.string :name
      t.string :icon_src
      t.string :host
      t.string :access_token_path
      t.string :request_token_path
      t.string :xspf_path
    
      t.timestamps
    end
  end

  def self.down
    drop_table :providers
  end
end
