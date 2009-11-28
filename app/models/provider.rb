class Provider < ActiveRecord::Base
  has_many :access_tokens
end
