require 'net/http'
require 'open-uri'
require 'nokogiri'

class Provider < ActiveRecord::Base
  WELL_KNOWN_HOST_META_PATH = '/.well-known/host-meta'
  XML_NS = { 
    :opensearch => 'http://a9.com/-/spec/opensearch/1.1/',
    :xrd => 'http://docs.oasis-open.org/ns/xri/xrd-1.0'
  }
  XRD_REL = { 
    :oauth_core_initiate             => 'http://oauth.net/core/1.0/endpoint/initiate',
    :oauth_core_token                => 'http://oauth.net/core/1.0/endpoint/token',
    :oauth_core_authorize            => 'http://oauth.net/core/1.0/endpoint/authorize',
    
    :oauth_discovery_static_consumer => 'http://oauth.net/discovery/1.0/consumer-identity/static',
    :xspf_discovery                 => 'http://playo.org/1.0/endpoint/discovery',
    :opensearch                     => 'http://a9.com/-/spec/opensearch/1.1/',
    #:xspf_search                    => 'http://playo.org/1.0/endpoint/search'
    }
  
  
  has_many :access_tokens
  has_many :tracks
  
  before_create :discover_capabilities
  
  def discover_capabilities
    # TODO isolate each discovery part from each other exception wise
    # parse /.well_known/


    initiate_link  = get_xrd_link_for(XRD_REL[:oauth_core_initiate])
    token_link     = get_xrd_link_for(XRD_REL[:oauth_core_token])
    authorize_link = get_xrd_link_for(XRD_REL[:oauth_core_authorize])
    
    if initiate_link && token_link && authorize_link
      self.supports_oauth = true
      self.request_token_path = initiate_link.attributes['href'].value
      self.access_token_path = token_link.attributes['href'].value
    
      discovery_link = get_xrd_link_for(XRD_REL[:oauth_discovery_static_consumer])
      if discovery_link
        self.supports_oauth_static_consumer = true
        self.consumer_token = discovery_link.attributes['localid'].value
        self.consumer_secret = ""
      end
    end
    
    xspf_discovery_link = get_xrd_link_for(XRD_REL[:xspf_discovery])
    if xspf_discovery_link
      self.supports_xspf_discovery = true
      self.xspf_discovery_path   = xspf_discovery_link.attributes['href'].value
    end
    
    
    opensearch_link = get_xrd_link_for(XRD_REL[:opensearch])
    if opensearch_link
      opensearch_xml = Nokogiri::XML(open(opensearch_link.attributes['href'].value))

      opensearch_urls = opensearch_xml.xpath("//xrd:Url[@type='application/xspf+xml']", 'xrd' => XML_NS[:opensearch])
      if opensearch_urls.length > 0 
        self.supports_xspf_opensearch        = true
        self.xspf_opensearch_query_template  = opensearch_urls.first.attributes['template'].value
      end
    end
    
    self
    # check oauth discovery
  rescue SocketError, OpenURI::HTTPError
    p 'Error'
    # discovery not supported
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
  
  
private
  
  def xrd
    return @xrd if @xrd
    @xrd = Nokogiri::XML(open("http://#{self.host}#{WELL_KNOWN_HOST_META_PATH}"))
    @xrd
  end
  
  def get_xrd_link_for(service)
    link = xrd.xpath("//xrd:Link[@rel='#{service}']", 'xrd' => XML_NS[:xrd])
    
    link.length > 0 ? link.first : nil
  end

end
