dataViewerControllers.controller('EcommerceSummaryReportViewController', ['$scope', 'StorageService', 'ProductOrderService', 'DateRangePickerService', 'DataTableService', function($scope, StorageService, ProductOrderService, DateRangePickerService, DataTableService) {
  $.AdminLTE.layout.fix();
  
  $scope.updateTime = '';
  
  var refreshUpdateTime = function() {
    $scope.updateTime = 'Updated ' + moment().format('M/D/YYYY h:mma');
    
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  };
  
  $scope.reportconfig = $.extend({
    datelabel: 'Last 24 Hours', 
    startdate: '', 
    enddate: '', 
    summaryinterval: 'hourly'
  }, StorageService.getStoredData('reportconfig_ecommerce_summary') || {});
  
  $('.daterangepicker').remove();
  
  DateRangePickerService.init('#report-config-datepicker', function (start, end, label) {
    $scope.reportconfig.datelabel = label;
    updateDateRange(label);
  });
  
  var updateDateRange = function(label) {
    DateRangePickerService.getDatesForRange(label, function(start, end) {
      $scope.reportconfig.startdate = start.format('YYYY-MM-DD[T]HH:mm:ssZ');
      $scope.reportconfig.enddate = end.format('YYYY-MM-DD[T]HH:mm:ssZ');
    });
    
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  };
  
  $scope.orders = [];
  
  $scope.ordersums = [];
  
  var getOrderSums = function(options) {
    ProductOrderService.getProductOrders({
      startDate: $scope.reportconfig.startdate, 
      endDate: $scope.reportconfig.enddate, 
      success: function(productOrders) {
        DataTableService.destroy('.report-table');
        
        if(productOrders.length > 0) {
          $.each(productOrders, function() {
            addOrder(this);
          });
        }
        
        DataTableService.init('.report-table');
      }, 
      complete: function() {
        refreshUpdateTime();
        
        $('.content .js--loading-overlay').addClass('hidden');
      }
    });
  }, 
  
  addOrder = function(order) {
    $scope.orders.push(order);
    
    var paymentDate = order.Payment.PaymentDate, 
    paymentHour = moment(paymentDate).format('YYYY-MM-DD[T]HH'), 
    paymentPeriod = paymentHour, 
    paymentAmount = Number(order.Payment.Amount), 
    orderSumIndex = -1;
    
    switch($scope.reportconfig.summaryinterval) {
      case 'daily':
        paymentPeriod = moment(paymentDate).format('YYYY-MM-DD');
        break;
      case 'weekly':
        paymentPeriod = moment(paymentDate).startOf('week').format('YYYY-MM-DD');
        break;
      case 'monthly':
        paymentPeriod = moment(paymentDate).format('YYYY-MM');
        break;
    }
    
    $.each($scope.ordersums, function(sumIndex) {
      if(this.period === paymentPeriod) {
        orderSumIndex = sumIndex;
      }
    });
    
    if(orderSumIndex === -1) {
      var paymentPeriodFormatted = moment(paymentDate).format('MMM D, YYYY - h:00a');
      
      switch($scope.reportconfig.summaryinterval) {
        case 'daily':
          paymentPeriodFormatted = moment(paymentDate).format('MMM D, YYYY');
          break;
        case 'weekly':
          paymentPeriodFormatted = moment(paymentDate).startOf('week').format('[Week of] MMM D, YYYY');
          break;
        case 'monthly':
          paymentPeriodFormatted = moment(paymentDate).format('MMM YYYY');
          break;
      }
      
      $scope.ordersums.push({
        period: paymentPeriod, 
        periodFormatted: paymentPeriodFormatted, 
        count: 0, 
        amount: 0, 
        amountFormatted: '$0.00'
      });
      
      orderSumIndex = $scope.ordersums.length - 1;
    }
    
    $scope.ordersums[orderSumIndex].count = $scope.ordersums[orderSumIndex].count + 1;
    $scope.ordersums[orderSumIndex].amount = Number($scope.ordersums[orderSumIndex].amount) + paymentAmount;
    $scope.ordersums[orderSumIndex].amountFormatted = $scope.ordersums[orderSumIndex].amount.toLocaleString('en', {
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 2
    });
    
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  };
  
  getOrderSums();
  
  $scope.refreshReport = function() {
    $scope.orders = [];
    
    $scope.ordersums = [];
    
    updateDateRange($scope.reportconfig.datelabel);
    
    DataTableService.destroy('.report-table');
    
    $('.content .js--loading-overlay').removeClass('hidden');
    
    getOrderSums();
  };
  
  $scope.updateReportConfig = function(e) {
    $('#report-config-modal').modal('hide');
    
    StorageService.storeData('reportconfig_ecommerce_summary', $scope.reportconfig, true);
    
    $scope.refreshReport();
  };
  
  $scope.download = function() {
    var csvData = 'Time Period,Total Count,Total Amount';
    $.each($scope.ordersums, function() {
      csvData += '\n' + 
                 '"' + this.periodFormatted + '",' + 
                 this.count + ',' + 
                 this.amountFormatted;
    });
    
    $('.js--report-save-as').off('change').on('change', function() {
      require('fs').writeFile($(this).val(), csvData, function(error) {
        if(error) {
          /* TODO */
        }
      });
    }).click();  
  };
}]);