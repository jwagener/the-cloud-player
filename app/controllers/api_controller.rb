class ApiController < ApplicationController
  def index
    
    redirect_url = 'http://api.soundcloud.com/'
    
    #params.each do |k,v|
    #redirect_to "http://api.soundcloud.com/tracks.json"
    render :layout => false
  end
end