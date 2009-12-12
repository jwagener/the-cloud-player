class SoundcloudConnectController < ApplicationController
  def index
    #if logged_in?
      #redirect_to :controller => 'campaigns'
    #end
  end
  
  def logout
    session['current_user'] = nil  
    set_current_user
    redirect_to :controller => 'players', :action => 'index'
  end
  
  # OAuth related actions
  def request_token
    request_token = $soundcloud_consumer.get_request_token(:oauth_callback => soundcloud_connect_access_token_url)
    session[:request_token_key] = request_token.token
    session[:request_token_secret] = request_token.secret    
    redirect_to "#{request_token.authorize_url}&display=popup"
  end

  def access_token
    request_token = OAuth::RequestToken.new($soundcloud_consumer, session[:request_token_key], session[:request_token_secret])
    access_token = request_token.get_access_token(:oauth_verifier => params[:oauth_verifier])
    session['current_user'] = @current_user = User.from_access_token(access_token)
  end 
  
end
