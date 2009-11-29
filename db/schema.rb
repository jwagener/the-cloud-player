# This file is auto-generated from the current state of the database. Instead of editing this file, 
# please use the migrations feature of Active Record to incrementally modify your database, and
# then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your database schema. If you need
# to create the application database on another system, you should be using db:schema:load, not running
# all the migrations from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20091128174830) do

  create_table "access_tokens", :force => true do |t|
    t.integer  "provider_id"
    t.integer  "remote_user_id"
    t.integer  "access_token_id"
    t.string   "username"
    t.string   "key"
    t.string   "secret"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "campaigns", :force => true do |t|
    t.integer  "soundcloud_user_id"
    t.string   "track_url"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "providers", :force => true do |t|
    t.string   "name"
    t.string   "icon_src"
    t.string   "host"
    t.string   "access_token_path"
    t.string   "request_token_path"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "soundcloud_users", :force => true do |t|
    t.string   "username"
    t.string   "access_token_key"
    t.string   "access_token_secret"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "soundcloud_id"
  end

end
