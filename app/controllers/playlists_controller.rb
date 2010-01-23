gem 'nokogiri'
require 'nokogiri'

class PlaylistsController < ApplicationController
  def index
    #TODO check security
    add_playlists = []
    begin
      add_playlists = Playlist.find(session[:playlists]) unless session[:playlists].blank?
    rescue ActiveRecord::RecordNotFound
      flash[:notice] = "Could not find this playlist, sorry!"
    end 
    
    playlists = if logged_in?
      session[:playlists] = []
      add_playlists.each do |playlist|
        PlaylistListing.find_or_create_by_user_id_and_playlist_id(:playlist_id => playlist.id, :user_id => current_user.id)
      end
      
      current_user.playlists
    else
       Playlist.static_guest_playlists + add_playlists
    end
  
    render :json => {:playlists => playlists.map(&:to_jspf)}
  end
    
  def view
    @playlist = Playlist.find_by_id(params[:playlist_param])
    
    # TODO jw if facebook render meta data
    
    if request.format == :html
      session[:playlists] ||= []
      session[:playlists] << @playlist.id
      session[:playlists].uniq
      @selected_playlist = @playlist
      render :template=> 'players/index', :layout => false
    end
    
    #render :xspf => playlist.to_xspf if request.format == :xspf || request.format == :all
    render :template => 'playlists/view.xspf.builder', :layout => false if request.format == :xspf || request.format == :all
    
    render :json => @playlist.to_jspf if request.xhr?
  end
    
  def remote
    location = params[:location]
    #playlist = Playlist.new(:location => params[:location], :access_token => access_token)
    head 401

    playlist = Playlist.find_or_create_by_location(:location => params[:location], :access_token => access_token, :user => current_user)
    if logged_in?
      playlist_listing = PlaylistListing.find_or_create_by_user_id_and_playlist_id(:playlist_id => playlist.id, :user_id => current_user.id)
    end
    
    if request.xhr?
      render :json => playlist.to_jspf
    else
      redirect_to playlist_view_path(playlist)
    end
  end
  
  def create
    playlist = if params[:location].blank?
      # local
      Playlist.create(params.slice(*Playlist::ALLOWED_ATTRIBUTES).merge({:user_id => current_user.id}))
    else
      # a remote playlist
      begin
        playlist = Playlist.new(:location => params[:location], :user_id => current_user.id)
        playlist.save!
      rescue Exception => e
        #if 401 and provider supports oauth
        p playlist
        return render :status => 202, :partial => 'players/authentication_required_box', :object => playlist.provider
    
      end
    end

    playlist_listing = PlaylistListing.find_or_create_by_user_id_and_playlist_id(:playlist_id => playlist.id, :user_id => current_user.id)
    
    render :json => playlist.to_jspf
  end
  
  def update
    # TODO Security
    playlist = Playlist.find_by_id(params[:playlist_param])

    playlist.update_attributes!(params.slice(*Playlist::ALLOWED_ATTRIBUTES))
    update_tracks(playlist, JSON.parse(params[:tracks])) if params[:tracks]
    render :json => playlist.to_jspf
  end
  
  
  def destroy
    playlist = Playlist.find_by_id(params[:playlist_param]).destroy
    render :nothing => true
    #Playlist.find_by_location(params[:location]).destroy
  end
  
  private
  
  def update_tracks(playlist, tracks_params)
    
    playlist.listings.destroy_all
    
    tracks_params.each_with_index do |track_params, i|
      track = Track.find_or_create_by_id({:id => track_params['identifier']}.merge(track_params))
      playlist.listings.create!(:track => track, :position => i)
      #track = Track.find_or_create_by_location(track_params, :include => [:listings])
      ##track.update_attributes!(track_params)
      #
      #has_listing = false 
      #p playlist
      #track.listings.each do |listing|
      #  p listing
      #  if listing.playlist == playlist
      #    p "position #{i} - #{listing}"
      #    listing.update_attributes!(:position => i) if listing.position != i
      #    has_listing = true
      #  end
      #end
      #
      #unless has_listing
      #  playlist.listings.create!(:track => track, :position => i)
      #end
    end      
  end
end
  