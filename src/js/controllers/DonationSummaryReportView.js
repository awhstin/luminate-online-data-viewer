dataViewerControllers.controller('DonationSummaryReportViewController', ['$scope', '$location', 'WebServicesService', function($scope, $location, WebServicesService) {
  $.AdminLTE.layout.fix();
  
  $scope.donations = [];
  
  $scope.donationsums = [];
  
  var addDonation = function(donation) {
    $scope.donations.push(donation);
    
    var paymentDateHour = donation.Payment.PaymentDate.split(':')[0], 
    donationSum;
    
    $.each($scope.donationsums, function(sumIndex) {
      if(this.period === paymentDateHour) {
        donationSum = this;
        
        $scope.donationsums[sumIndex].count = $scope.donationsums[sumIndex].count + 1;
        
        $scope.donationsums[sumIndex].amount = Number($scope.donationsums[sumIndex].amount) + Number(donation.Payment.Amount);
      }
    });
    
    if(!donationSum) {
      donationsums = {
        period: paymentDateHour, 
        count: 1, 
        amount: donation.Payment.Amount
      };
      
      $scope.donationsums.push(donationsums);
    }
    
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  }, 
  
  getDonationSums = function(options) {
    var settings = $.extend({
      page: '1'
    }, options || {}), 
    
    now = new Date(), 
    oneDayAgo = new Date(now - (24 * 60 * 60 * 1000)).toISOString().split('.')[0] + '+00:00';
    
    WebServicesService.query({
      statement: 'select TransactionId, Payment.Amount, Payment.PaymentDate from Donation where Payment.PaymentDate >= ' + oneDayAgo, 
      page: settings.page, 
      error: function() {
        /* TODO */
      }, 
      success: function(response) {
        var $faultstring = $(response).find('faultstring');
        
        if($faultstring.length > 0) {
          /* TODO */
        }
        else {
          var $records = $(response).find('Record');
          
          if($records.length === 0) {
            /* TODO */
          }
          else {
            $records.each(function() {
              var transactionId = $(this).find('TransactionId').text(), 
              $payment = $(this).find('Payment'), 
              paymentAmount = $payment.find('Amount').text(), 
              paymentDate = $payment.find('PaymentDate').text();
              
              addDonation({
                'TransactionId': transactionId, 
                'Payment': {
                  'Amount': paymentAmount, 
                  'PaymentDate': paymentDate
                }
              });
            });
          }
          
          if($records.length === 200) {
            getDonationSums({
              page: '' + (Number(settings.page) + 1)
            });
          }
          else {
            $('.report-table').DataTable({
              'paging': true, 
              'lengthChange': false, 
              'searching': false, 
              'ordering': true, 
              'order': [
                [0, 'desc']
              ], 
              'info': true, 
              'autoWidth': false
            });
            
            $('.content .js--loading-overlay').addClass('hidden');
          }
        }
      }
    });
  };
  
  getDonationSums();
}]);