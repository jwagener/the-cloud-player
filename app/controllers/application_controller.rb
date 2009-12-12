# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.
require 'soundcloud'

class ApplicationController < ActionController::Base
  helper :all # include all helpers, all the time
  #protect_from_forgery # See ActionController::RequestForgeryProtection for details

  before_filter :set_current_user
  
  def set_current_user
    @current_user = session['current_user_id'].blank? ? nil : User.find(session['current_user_id'])
  end

  def logged_in?
    !!@current_user
  end
  
  def current_user
    @current_user
  end

  def sc_api_track_to_xspf_track(api_track)
    if api_track.streamable
      {
        :title => api_track.title,
        :creator => api_track.attributes['user'].username,
        :location => api_track.stream_url,
        :identifier => api_track.permalink_url.hash.abs,
        :duration => api_track.duration,
        :source => "soundcloud"
      }
    end
  end

  # Scrub sensitive parameters from your log
  # filter_parameter_logging :password
end
