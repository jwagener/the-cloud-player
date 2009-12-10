class Provider < ActiveRecord::Base
  has_many :access_tokens
  has_many :tracks
end
