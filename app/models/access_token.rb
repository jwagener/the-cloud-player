require 'soundcloud'

class AccessToken < ActiveRecord::Base
  belongs_to :provider
  
  def self.from_access_token(access_token)
    soundcloud_client = Soundcloud.register({:access_token => access_token, :site => $settings[:soundcloud_consumer][:site]})
    soundcloud_user = soundcloud_client.User.find_me
    
    at = find_or_create_by_remote_user_id(:remote_user_id       => soundcloud_user.id)
    at.provider_id  = 1
    at.username     = soundcloud_user.username
    at.key          = access_token.token
    at.secret       = access_token.secret
    
    at.save!
    at
  end
  
  
  def access_token
    OAuth::AccessToken.new($soundcloud_consumer, access_token_key, access_token_secret)
    
  end
  
  def client
    return @client if @client
    @client = Soundcloud.register({:access_token => access_token, :site => $settings[:soundcloud_consumer][:site]})
   end 
end
