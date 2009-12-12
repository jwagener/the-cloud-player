require 'net/http'

class Provider < ActiveRecord::Base
  WELL_KNOWN_HOST_META_PATH = '/.well-known/host-meta'
  has_many :access_tokens
  has_many :tracks
  
  before_create :discover_capabilities
  
  def discover_capabilities
    # parse /.well_known/
    #r = Net::HTTP.get("http://#{host}#{WELL_KNOWN_HOST_META_PATH}")
    
    #p r
    # check oauth discovery
    
    #
    
    
    
    
    
  end
  
  #def self.find_or_create_by_host(*args)
  def self.from_host(host)
    provider = find_or_create_by_host(:host => host)
    # do cool stuff like getting a nice favicon!
    # try todo oauth discover 
  
    provider
  end

  def icon_src
    src = read_attribute(:icon_src)
    src.blank? ? "http://#{host}/favicon.ico" : src
  end
end
