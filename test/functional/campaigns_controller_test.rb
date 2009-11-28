require 'test_helper'

class CampaignsControllerTest < ActionController::TestCase
  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:campaigns)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create campaign" do
    assert_difference('Campaign.count') do
      post :create, :campaign => { }
    end

    assert_redirected_to campaign_path(assigns(:campaign))
  end

  test "should show campaign" do
    get :show, :id => campaigns(:one).to_param
    assert_response :success
  end

  test "should get edit" do
    get :edit, :id => campaigns(:one).to_param
    assert_response :success
  end

  test "should update campaign" do
    put :update, :id => campaigns(:one).to_param, :campaign => { }
    assert_redirected_to campaign_path(assigns(:campaign))
  end

  test "should destroy campaign" do
    assert_difference('Campaign.count', -1) do
      delete :destroy, :id => campaigns(:one).to_param
    end

    assert_redirected_to campaigns_path
  end
end
