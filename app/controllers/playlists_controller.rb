class PlaylistsController < ApplicationController
  def index
  
    render :layout => false
  end
  
  def view
    params[:playlist_param]
  
    render :layout => false
  end
end
  