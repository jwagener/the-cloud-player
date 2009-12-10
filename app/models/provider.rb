class Provider < ActiveRecord::Base
  has_many :access_tokens
  has_many :tracks
  
  #def self.find_or_create_by_host(*args)
  def self.from_host(host)
    find_or_create_by_host(:host => host)
   # do cool stuff like getting a nice favicon!
   # try todo oauth discover 
  end
end
