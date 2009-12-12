gem 'nokogiri'
require 'nokogiri'

class PlaylistsController < ApplicationController
  def index
    if logged_in?
      #playlists = playlists + Playlist.find(:all, :conditions => ['user_id = ?',current_user.id]).map(&:to_jspf)
      render :json => { :playlists => current_user.playlists.map(&:to_jspf) }
    else
      playlists = [ Playlist.new(:location => 'http://sandbox-soundcloud.com/xspf?url=http://sandbox-soundcloud.com/forss/sets/soulhack') ] 
      playlists = playlists.map(&:to_jspf)
      render :json => { :playlists => playlists }
    end
  end
    
  def view 
    playlist = Playlist.find_by_id(params[:playlist_param])
    render :json => playlist.to_jspf
  end
    
  def remote
    location = params[:location]
    if URI.parse(location).host == 'sandbox-soundcloud.com'
      access_token = current_user
    else
      access_token = nil
    end
    #playlist = Playlist.new(:location => params[:location], :access_token => access_token)
    playlist = Playlist.find_or_create_by_location(:location => params[:location], :access_token => access_token, :user => current_user)
    playlist_listing = PlaylistListing.find_or_create_by_user_id_and_playlist_id(:playlist_id => playlist.id, :user_id => current_user.id)
    
    render :json => playlist.to_jspf
  end
  
  def create
    playlist = if params[:location].blank?
      # local
      Playlist.create(params.slice(*Playlist::ALLOWED_ATTRIBUTES).merge({:user_id => current_user.id}))
    else
      # a remote playlist
      Playlist.create(:location => params[:location], :user_id => current_user.id)
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
      p track_params
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
  