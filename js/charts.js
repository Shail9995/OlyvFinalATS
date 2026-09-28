/**
 * OLYV ATS - Chart.js Visualizations Controller
 * High-performance, GPU-accelerated interactive charts for Tab 1
 */

(function (window) {
  'use strict';

  class OlyvCharts {
    constructor() {
      this.tatChart = null;
      this.sourceChart = null;
      this.funnelChart = null;
      this.stagePassFailChart = null;
      this.offerDeclineChart = null;
      this.tatDays = 30; // Default timeframe
    }

    /**
     * Initialize or update all charts for current active department
     */
    renderAll(currentDepartment = null) {
      this.renderTatChart(currentDepartment);
      this.renderSourceChart(currentDepartment);
      this.renderFunnelChart(currentDepartment);
      this.renderStagePassFailChart(currentDepartment);
      this.renderOfferDeclineChart(currentDepartment);
    }

    /**
     * Set TAT Timeframe (7, 15, 30, 60, 90)
     */
    setTimeframe(days, currentDepartment = null) {
      this.tatDays = days;
      this.renderTatChart(currentDepartment);
    }

    /**
     * 1. TAT Trend Line Chart
     */
    renderTatChart(currentDepartment = null) {
      const ctx = document.getElementById('tatTrendChart');
      if (!ctx) return;

      const dataPoints = window.OlyvDB.getTatTrend(this.tatDays, currentDepartment);
      const labels = dataPoints.map(p => p.date);
      const actualTat = dataPoints.map(p => p.avgTat);
      const targetTat = dataPoints.map(p => p.targetTat);

      if (this.tatChart) {
        this.tatChart.destroy();
      }

      const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

      this.tatChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Actual Turnaround Time (Days)',
              data: actualTat,
              borderColor: '#2563eb',
              backgroundColor: gradient,
              borderWidth: 2.5,
              pointBackgroundColor: '#1d4ed8',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.35
            },
            {
              label: 'Target Benchmark (30 Days)',
              data: targetTat,
              borderColor: '#ef4444',
              borderWidth: 2,
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
              tension: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                boxWidth: 12,
                font: { size: 12, family: 'Inter, sans-serif', weight: '500' },
                color: '#475569'
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#cbd5e1',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ${context.parsed.y} days`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              min: 10,
              max: 45,
              grid: {
                color: '#e2e8f0',
                drawBorder: false
              },
              ticks: {
                color: '#64748b',
                font: { size: 11, family: 'Inter, sans-serif' },
                callback: v => `${v}d`
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#64748b',
                font: { size: 11, family: 'Inter, sans-serif' }
              }
            }
          }
        }
      });
    }

    /**
     * 2. Source Mix Doughnut Chart
     */
    renderSourceChart(currentDepartment = null) {
      const ctx = document.getElementById('sourceMixChart');
      if (!ctx) return;

      const sourceCounts = window.OlyvDB.getSourceDistribution(currentDepartment);
      const labels = Object.keys(sourceCounts);
      const values = Object.values(sourceCounts);

      const colors = [
        '#0284c7', // LinkedIn - Sky
        '#10b981', // Referral - Emerald
        '#f59e0b', // Naukri - Amber
        '#8b5cf6', // Agency - Purple
        '#64748b'  // Direct - Slate
      ];

      if (this.sourceChart) {
        this.sourceChart.destroy();
      }

      const totalCandidates = values.reduce((a, b) => a + b, 0);

      this.sourceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              hoverOffset: 6,
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                padding: 12,
                font: { size: 11, family: 'Inter, sans-serif', weight: '500' },
                color: '#475569'
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#cbd5e1',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  const val = context.raw || 0;
                  const pct = totalCandidates > 0 ? Math.round((val / totalCandidates) * 100) : 0;
                  return ` ${context.label}: ${val} candidates (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    /**
     * 3. Active Pipeline Funnel Bar Chart
     */
    renderFunnelChart(currentDepartment = null) {
      const ctx = document.getElementById('pipelineFunnelChart');
      if (!ctx) return;

      const funnelData = window.OlyvDB.getPipelineFunnel(currentDepartment);

      if (this.funnelChart) {
        this.funnelChart.destroy();
      }

      // Gradients / Stage-specific colors
      const barColors = [
        '#3b82f6', // Shortlisted - Blue
        '#60a5fa', // Round 1
        '#818cf8', // Round 2
        '#a855f7', // Round 3
        '#c084fc', // HR Round
        '#f59e0b', // Preboarding - Amber
        '#10b981', // Offered - Emerald
        '#059669'  // Joined - Dark Emerald
      ];

      this.funnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: funnelData.stages,
          datasets: [
            {
              label: 'Candidate Volume',
              data: funnelData.counts,
              backgroundColor: barColors,
              borderRadius: 6,
              borderSkipped: false,
              barThickness: 24
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y', // Horizontal bars for clear funnel perspective
          cursor: 'pointer',
          onHover: (event, chartElement) => {
            const target = event.native ? event.native.target : event.chart.canvas;
            if (target) {
              target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            }
          },
          onClick: (event, elements) => {
            if (elements && elements.length > 0) {
              const elementIndex = elements[0].index;
              const clickedStage = funnelData.stages[elementIndex];
              if (clickedStage && window.OlyvApp) {
                window.OlyvApp.filterByFunnelStage(clickedStage);
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  return ` Volume: ${context.parsed.x} candidates (Click to view)`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                color: '#e2e8f0',
                drawBorder: false
              },
              ticks: {
                precision: 0,
                color: '#64748b',
                font: { size: 11, family: 'Inter, sans-serif' }
              }
            },
            y: {
              grid: {
                display: false
              },
              ticks: {
                color: '#334155',
                font: { size: 12, family: 'Inter, sans-serif', weight: '600' }
              }
            }
          }
        }
      });
    }

    /**
     * 4. Stage Pass / Rejection Analytics Bar Chart
     */
    renderStagePassFailChart(currentDepartment = null) {
      const ctx = document.getElementById('stagePassFailChart');
      if (!ctx) return;

      const data = window.OlyvDB.getStagePassFailAnalytics(currentDepartment);

      if (this.stagePassFailChart) {
        this.stagePassFailChart.destroy();
      }

      this.stagePassFailChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.stages,
          datasets: [
            {
              label: 'Selected / Advanced',
              data: data.selected,
              backgroundColor: '#10b981',
              borderRadius: 4,
              barThickness: 16
            },
            {
              label: 'Rejected / Disqualified',
              data: data.rejected,
              backgroundColor: '#ef4444',
              borderRadius: 4,
              barThickness: 16
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                font: { size: 11, family: 'Inter, sans-serif', weight: '600' }
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 10,
              cornerRadius: 8
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11, family: 'Inter, sans-serif' } }
            },
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: { precision: 0, font: { size: 11, family: 'Inter, sans-serif' } }
            }
          }
        }
      });
    }

    /**
     * 5. Offer Decline Reasons & Outcomes Chart
     */
    renderOfferDeclineChart(currentDepartment = null) {
      const ctx = document.getElementById('offerDeclineChart');
      if (!ctx) return;

      const data = window.OlyvDB.getOfferDeclineAnalytics(currentDepartment);
      const labels = Object.keys(data.reasons);
      const values = Object.values(data.reasons);

      if (this.offerDeclineChart) {
        this.offerDeclineChart.destroy();
      }

      this.offerDeclineChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: [
                '#ef4444', // Counter offer
                '#f59e0b', // Comp mismatch
                '#3b82f6', // Location
                '#8b5cf6', // Notice buyout
                '#64748b'  // Personal
              ],
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                font: { size: 10.5, family: 'Inter, sans-serif', weight: '500' }
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 10,
              cornerRadius: 8
            }
          },
          cutout: '62%'
        }
      });
    }
  }

  window.OlyvCharts = new OlyvCharts();
})(window);
