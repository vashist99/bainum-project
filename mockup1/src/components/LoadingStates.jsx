import { Loader2, AlertCircle, Users, Building2, FileText, Search } from "lucide-react";

// Loading spinner component
export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

// Full page loading component
export const PageLoading = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl p-8">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="xl" className="text-primary" />
          <h2 className="text-xl font-semibold text-base-content">{message}</h2>
          <p className="text-sm text-base-content/60">Please wait while we load your data</p>
        </div>
      </div>
    </div>
  );
};

// Card loading skeleton
export const CardLoading = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-xl animate-pulse">
          <div className="card-body">
            <div className="skeleton w-8 h-8 rounded-lg mb-3"></div>
            <div className="skeleton w-3/4 h-6 mb-2"></div>
            <div className="skeleton w-full h-4 mb-1"></div>
            <div className="skeleton w-2/3 h-4"></div>
            <div className="flex gap-2 mt-4">
              <div className="skeleton w-16 h-8"></div>
              <div className="skeleton w-16 h-8"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table loading skeleton
export const TableLoading = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <div className="skeleton w-24 h-4"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="animate-pulse">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  <div className="skeleton w-full h-4"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Stats cards loading
export const StatsLoading = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-xl animate-pulse">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="skeleton w-12 h-12 rounded-lg mb-3"></div>
                <div className="skeleton w-16 h-8 mb-2"></div>
                <div className="skeleton w-24 h-4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Empty state component
export const EmptyState = ({ 
  icon: IconComponent = AlertCircle, // eslint-disable-line no-unused-vars
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}) => {
  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-base-200 p-8 rounded-full mb-6">
            <IconComponent className="w-16 h-16 text-base-content/40" />
          </div>
          <h3 className="text-xl font-bold text-base-content mb-2">{title}</h3>
          <p className="text-base-content/60 max-w-md mb-6">{description}</p>
          {actionLabel && onAction && (
            <button onClick={onAction} className="btn btn-primary">
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Specific empty states
export const EmptyTeachers = ({ onAdd }) => (
  <EmptyState
    icon={Users}
    title="No Teachers Found"
    description="Start building your educational team by adding your first teacher to the platform."
    actionLabel="Add Teacher"
    onAction={onAdd}
  />
);

export const EmptySchools = ({ onAdd }) => (
  <EmptyState
    icon={Building2}
    title="No Schools Registered"
    description="Create your first school to start organizing teachers and students."
    actionLabel="Add School"
    onAction={onAdd}
  />
);

export const EmptyChildren = ({ onAdd, teacherName = null }) => (
  <EmptyState
    icon={Users}
    title={teacherName ? `No Students for ${teacherName}` : "No Children Found"}
    description={
      teacherName 
        ? "This teacher doesn't have any students assigned yet."
        : "Start tracking student progress by adding your first child to the platform."
    }
    actionLabel="Add Child"
    onAction={onAdd}
  />
);

export const EmptySearchResults = ({ searchTerm, onClear }) => (
  <EmptyState
    icon={Search}
    title="No Results Found"
    description={`We couldn't find any results for "${searchTerm}". Try adjusting your search terms.`}
    actionLabel="Clear Search"
    onAction={onClear}
  />
);

export const EmptyData = ({ type = "data" }) => (
  <EmptyState
    icon={FileText}
    title="No Data Available"
    description={`No ${type} has been recorded yet. Upload recordings or assessments to see analytics.`}
  />
);

// Error state component
export const ErrorState = ({ 
  title = "Something went wrong", 
  description = "We encountered an error while loading your data.",
  onRetry,
  className = ""
}) => {
  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-error/10 p-8 rounded-full mb-6">
            <AlertCircle className="w-16 h-16 text-error" />
          </div>
          <h3 className="text-xl font-bold text-base-content mb-2">{title}</h3>
          <p className="text-base-content/60 max-w-md mb-6">{description}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn btn-outline">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};